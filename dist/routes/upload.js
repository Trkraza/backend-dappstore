"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = uploadRoutes;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const schema_1 = require("../lib/schema"); // Assuming schema.ts is in lib/
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
const API_KEY = process.env.API_KEY;
async function uploadRoutes(fastify) {
    // Pre-handler for API key authentication
    fastify.addHook('preHandler', async (request, reply) => {
        if (request.headers['x-api-key'] !== API_KEY) {
            reply.status(401).send({ message: 'Unauthorized: Invalid API Key' });
        }
    });
    fastify.post('/api/upload', async (request, reply) => {
        try {
            const masterFilePath = path_1.default.join(process.cwd(), 'data', 'master.json');
            const tempLogosDir = path_1.default.join(process.cwd(), 'assets', 'temp-logos');
            // Read master.json
            let masterData = [];
            if (await fs_extra_1.default.pathExists(masterFilePath)) {
                const masterFileContent = await fs_extra_1.default.readFile(masterFilePath, 'utf-8');
                masterData = schema_1.masterSchema.parse(JSON.parse(masterFileContent));
            }
            // Get list of local logo files
            const localLogoFiles = await fs_extra_1.default.readdir(tempLogosDir);
            const imageFiles = localLogoFiles.filter(file => /\.(png|jpg|jpeg|gif|webp|avif)$/i.test(file));
            const updatedDApps = [];
            const uploadedImageMap = {};
            for (const file of imageFiles) {
                const filePath = path_1.default.join(tempLogosDir, file);
                const publicId = `dapp_logos/${path_1.default.parse(file).name}`; // e.g., dapp_logos/my-cool-dapp
                try {
                    const uploadResult = await cloudinary_1.v2.uploader.upload(filePath, {
                        public_id: publicId,
                        overwrite: true,
                        invalidate: true,
                        quality: 'auto',
                        fetch_format: 'auto',
                    });
                    uploadedImageMap[file] = uploadResult.secure_url;
                    fastify.log.info(`Uploaded ${file} to Cloudinary: ${uploadResult.secure_url}`);
                    // Optionally delete the local file after successful upload
                    await fs_extra_1.default.remove(filePath);
                }
                catch (uploadErr) {
                    fastify.log.error(`Failed to upload ${file}: ${(uploadErr instanceof Error ? uploadErr.message : String(uploadErr))}`);
                    // Continue to next file even if one fails
                }
            }
            // Update masterData with new logo URLs
            let changedCount = 0;
            for (const dapp of masterData) {
                // Assuming logo field in master.json contains the filename from temp-logos initially
                const filename = path_1.default.basename(dapp.logo);
                if (uploadedImageMap[filename] && dapp.logo !== uploadedImageMap[filename]) {
                    dapp.logo = uploadedImageMap[filename];
                    updatedDApps.push(dapp);
                    changedCount++;
                }
            }
            if (changedCount > 0) {
                await fs_extra_1.default.writeFile(masterFilePath, JSON.stringify(masterData, null, 2), 'utf-8');
                return reply.status(200).send({
                    message: `${changedCount} DApps updated with new Cloudinary logo URLs.`,
                    updatedDApps: updatedDApps.map(d => ({ name: d.name, logo: d.logo })),
                });
            }
            else {
                return reply.status(200).send({ message: 'No DApps needed logo updates.' });
            }
        }
        catch (error) {
            fastify.log.error(error, 'Error in /api/upload:');
            return reply.status(500).send({ message: 'Internal Server Error', error: (error instanceof Error ? error.message : String(error)) });
        }
    });
}
