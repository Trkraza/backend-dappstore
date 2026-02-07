// D:\projects\dapp-store\backend-dappstore\src\scripts\distill.ts

import fs from 'fs-extra';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { metaJsonSchema, MetaJson, appsMinSchema, AppsMin, slugsSchema } from '../../lib/schema';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function distillDAppData(): Promise<void> {
  const appsDirPath = path.join(process.cwd(), 'data', 'apps');
  const outputDataDirPath = path.join(process.cwd(), 'data'); // Output apps.min.json and slugs.json here
  const processedAppsMin: AppsMin[] = [];
  const processedSlugs: string[] = [];
  let hasErrors = false;

  console.log('Starting DApp data distillation...');

  if (!(await fs.pathExists(appsDirPath))) {
    console.error(`Error: Directory not found at ${appsDirPath}`);
    process.exit(1);
  }

  await fs.ensureDir(outputDataDirPath); // Ensure output directory exists

  const metaJsonPaths: string[] = [];
  const findMetaJsonFiles = async (currentDir: string) => {
    const items = await fs.readdir(currentDir);
    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        await findMetaJsonFiles(itemPath);
      } else if (stat.isFile() && item === 'meta.json') {
        metaJsonPaths.push(itemPath);
      }
    }
  };
  await findMetaJsonFiles(appsDirPath);

  if (metaJsonPaths.length === 0) {
    console.warn('No meta.json files found to distill.');
    // If no files, we still want to generate empty output files
    await fs.writeFile(path.join(outputDataDirPath, 'apps.min.json'), JSON.stringify([]), 'utf-8');
    await fs.writeFile(path.join(outputDataDirPath, 'slugs.json'), JSON.stringify([]), 'utf-8');
    process.exit(0);
  }

  for (const metaJsonPath of metaJsonPaths) {
    try {
      const fileContent = await fs.readFile(metaJsonPath, 'utf-8');
      const jsonData = JSON.parse(fileContent);

      // 1. Validate against Zod schema (using metaJsonSchema)
      const parsedData: MetaJson = metaJsonSchema.parse(jsonData);

      // 2. Validate slug matches folder name
      const folderName = path.basename(path.dirname(metaJsonPath));
      if (parsedData.slug !== folderName) {
        hasErrors = true;
        console.error(
          `Distillation Error in ${metaJsonPath}: Slug mismatch. Expected "${folderName}", got "${parsedData.slug}". Skipping.`
        );
        continue; // Skip this DApp
      }

      let finalLogoUrl = parsedData.logoUrl;
      const isLocalLogo = !finalLogoUrl.startsWith('http') && !finalLogoUrl.startsWith('https');

      if (isLocalLogo) {
        const localImagePath = path.join(path.dirname(metaJsonPath), finalLogoUrl);
        if (await fs.pathExists(localImagePath)) {
          console.log(`Uploading local logo for ${parsedData.name} from ${localImagePath}...`);
          try {
            const publicId = `dapp_logos/${parsedData.slug}`; // Unique public ID for Cloudinary
            const uploadResult = await cloudinary.uploader.upload(localImagePath, {
              public_id: publicId,
              overwrite: true,
              invalidate: true,
              quality: 'auto',
              fetch_format: 'auto',
            });
            finalLogoUrl = uploadResult.secure_url;
            console.log(`Successfully uploaded logo for ${parsedData.name}: ${finalLogoUrl}`);

            // Update the source meta.json file in place
            parsedData.logoUrl = finalLogoUrl;
            await fs.writeFile(metaJsonPath, JSON.stringify(parsedData, null, 2), 'utf-8');
            console.log(`Updated logoUrl in ${metaJsonPath}`);

          } catch (uploadErr) {
            hasErrors = true;
            console.error(uploadErr, `Failed to upload logo for ${parsedData.name} from ${localImagePath}. Skipping DApp.`);
            continue; // Skip this DApp
          }
        } else {
          hasErrors = true;
          console.error(`Distillation Error in ${metaJsonPath}: Local logo file not found at ${localImagePath}. Skipping DApp.`);
          continue; // Skip this DApp
        }
      } else {
        console.log(`Logo for ${parsedData.name} is already a CDN URL: ${finalLogoUrl}`);
      }

      // Extract listing-specific fields for apps.min.json
      const minifiedApp: AppsMin = {
        slug: parsedData.slug,
        name: parsedData.name,
        logoUrl: finalLogoUrl, // Use the (potentially updated) CDN URL
        category: parsedData.category,
        chains: parsedData.chains,
        short: parsedData.content.short,
      };

      // Validate minifiedApp against appsMinSchema to ensure it's correct
      appsMinSchema.parse(minifiedApp);
      processedAppsMin.push(minifiedApp);
      processedSlugs.push(parsedData.slug);

    } catch (error) {
      hasErrors = true;
      if (error instanceof Error) {
        console.error(error, `Distillation Error in ${metaJsonPath}:`);
      } else {
        console.error(`Distillation Error in ${metaJsonPath}: An unknown error occurred.`);
      }
      continue; // Continue processing other DApps
    }
  }

  // Generate and write data/apps.min.json
  try {
    await fs.writeFile(path.join(outputDataDirPath, 'apps.min.json'), JSON.stringify(processedAppsMin, null, 2), 'utf-8');
    console.log('Generated data/apps.min.json');
  } catch (error) {
    hasErrors = true;
    console.error(error, 'Failed to write data/apps.min.json');
  }

  // Generate and write data/slugs.json
  try {
    await fs.writeFile(path.join(outputDataDirPath, 'slugs.json'), JSON.stringify(processedSlugs, null, 2), 'utf-8');
    console.log('Generated data/slugs.json');
  } catch (error) {
    hasErrors = true;
    console.error(error, 'Failed to write data/slugs.json');
  }


  if (hasErrors) {
    console.error(`
DApp data distillation FAILED with errors.`);
    process.exit(1);
  } else {
    console.log(`
DApp data distillation PASSED successfully.`);
    process.exit(0);
  }
}

if (require.main === module) {
  distillDAppData();
}
