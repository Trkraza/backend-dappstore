// D:\projects\dapp-store\backend-dappstore\routes\upload.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs-extra';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { masterSchema, dappSchema, DApp } from '../lib/schema'; // Assuming schema.ts is in lib/

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const API_KEY = process.env.API_KEY;

export default async function uploadRoutes(fastify: FastifyInstance) {
  // Pre-handler for API key authentication
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.headers['x-api-key'] !== API_KEY) {
      reply.status(401).send({ message: 'Unauthorized: Invalid API Key' });
    }
  });

  fastify.post('/api/upload', async (request, reply) => {
    try {
      const masterFilePath = path.join(process.cwd(), 'data', 'master.json');
      const tempLogosDir = path.join(process.cwd(), 'assets', 'temp-logos');

      // Read master.json
      let masterData: DApp[] = [];
      if (await fs.pathExists(masterFilePath)) {
        const masterFileContent = await fs.readFile(masterFilePath, 'utf-8');
        masterData = masterSchema.parse(JSON.parse(masterFileContent));
      }

      // Get list of local logo files
      const localLogoFiles = await fs.readdir(tempLogosDir);
      const imageFiles = localLogoFiles.filter(file => /\.(png|jpg|jpeg|gif|webp|avif)$/i.test(file));

      const updatedDApps: DApp[] = [];
      const uploadedImageMap: { [key: string]: string } = {};

      for (const file of imageFiles) {
        const filePath = path.join(tempLogosDir, file);
        const publicId = `dapp_logos/${path.parse(file).name}`; // e.g., dapp_logos/my-cool-dapp

        try {
          const uploadResult = await cloudinary.uploader.upload(filePath, {
            public_id: publicId,
            overwrite: true,
            invalidate: true,
            quality: 'auto',
            fetch_format: 'auto',
          });
          uploadedImageMap[file] = uploadResult.secure_url;
          fastify.log.info(`Uploaded ${file} to Cloudinary: ${uploadResult.secure_url}`);
          // Optionally delete the local file after successful upload
          await fs.remove(filePath);
        } catch (uploadErr) {
          fastify.log.error(`Failed to upload ${file}: ${(uploadErr instanceof Error ? uploadErr.message : String(uploadErr))}`);
          // Continue to next file even if one fails
        }
      }

      // Update masterData with new logo URLs
      let changedCount = 0;
      for (const dapp of masterData) {
        // Assuming logo field in master.json contains the filename from temp-logos initially
        const filename = path.basename(dapp.logo);
        if (uploadedImageMap[filename] && dapp.logo !== uploadedImageMap[filename]) {
          dapp.logo = uploadedImageMap[filename];
          updatedDApps.push(dapp);
          changedCount++;
        }
      }

      if (changedCount > 0) {
        await fs.writeFile(masterFilePath, JSON.stringify(masterData, null, 2), 'utf-8');
        return reply.status(200).send({
          message: `${changedCount} DApps updated with new Cloudinary logo URLs.`,
          updatedDApps: updatedDApps.map(d => ({ name: d.name, logo: d.logo })),
        });
      } else {
        return reply.status(200).send({ message: 'No DApps needed logo updates.' });
      }

    } catch (error) {
      fastify.log.error(error, 'Error in /api/upload:');
      return reply.status(500).send({ message: 'Internal Server Error', error: (error instanceof Error ? error.message : String(error)) });
    }
  });
}