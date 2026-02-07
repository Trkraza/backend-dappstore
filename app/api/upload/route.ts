import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';
import { masterSchema, DApp } from '@/lib/schema';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  // 1. Security Check: Validate API Key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. File System: Define paths and read data
    const dataDir = path.join(process.cwd(), 'data');
    const masterJsonPath = path.join(dataDir, 'master.json');
    const tempLogosDir = path.join(process.cwd(), 'assets', 'temp-logos');

    const masterJsonContent = await fs.readFile(masterJsonPath, 'utf-8');
    let dapps: DApp[] = JSON.parse(masterJsonContent);

    // 3. Validation: Parse data with Zod schema
    masterSchema.parse(dapps);

    // 4. Find DApps with local logos that need uploading
    const dappsToUpload = dapps.filter(dapp => 
        dapp.logo.startsWith('assets/temp-logos/') && !dapp.logo.startsWith('https://')
    );

    if (dappsToUpload.length === 0) {
      return NextResponse.json({ message: 'No new logos to upload.' });
    }

    // 5. Upload to Cloudinary
    const uploadPromises = dappsToUpload.map(async (dapp) => {
      const localLogoPath = path.join(process.cwd(), dapp.logo);
      
      // Extract the filename without extension to use as public_id
      const publicId = path.parse(dapp.logo).name;

      const result = await cloudinary.uploader.upload(localLogoPath, {
        public_id: publicId,
        folder: 'dapp-store-logos', // Optional: organize in Cloudinary
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      
      return { slug: dapp.slug, newUrl: result.secure_url };
    });

    const uploadedResults = await Promise.all(uploadPromises);

    // 6. Update master JSON with new Cloudinary URLs
    uploadedResults.forEach(({ slug, newUrl }) => {
      const dappIndex = dapps.findIndex(d => d.slug === slug);
      if (dappIndex !== -1) {
        dapps[dappIndex].logo = newUrl;
      }
    });

    // 7. Write updated data back to master.json
    await fs.writeFile(masterJsonPath, JSON.stringify(dapps, null, 2));

    return NextResponse.json({ 
      message: `Successfully uploaded ${uploadedResults.length} logos.`,
      uploaded: uploadedResults,
    });

  } catch (error) {
    console.error('Error in /api/upload:', error);
    // Handle Zod errors or other issues
    if (error instanceof Error) {
        return NextResponse.json({ message: 'An internal error occurred.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred.' }, { status: 500 });
  }
}
