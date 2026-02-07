"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = distillRoutes;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const schema_1 = require("../lib/schema");
const API_KEY = process.env.API_KEY;
async function distillRoutes(fastify) {
    // Pre-handler for API key authentication
    fastify.addHook('preHandler', async (request, reply) => {
        if (request.headers['x-api-key'] !== API_KEY) {
            reply.status(401).send({ message: 'Unauthorized: Invalid API Key' });
        }
    });
    fastify.post('/api/distill', async (request, reply) => {
        try {
            const masterFilePath = path_1.default.join(process.cwd(), 'data', 'master.json');
            const collectionsDirPath = path_1.default.join(process.cwd(), 'data', 'collections');
            // Ensure collections directory exists
            await fs_extra_1.default.ensureDir(collectionsDirPath);
            // Read master.json
            if (!(await fs_extra_1.default.pathExists(masterFilePath))) {
                return reply.status(404).send({ message: 'master.json not found.' });
            }
            const masterFileContent = await fs_extra_1.default.readFile(masterFilePath, 'utf-8');
            const masterData = schema_1.masterSchema.parse(JSON.parse(masterFileContent));
            // Create 'all.json'
            await fs_extra_1.default.writeFile(path_1.default.join(collectionsDirPath, 'all.json'), JSON.stringify(masterData, null, 2), 'utf-8');
            fastify.log.info('Created all.json in collections.');
            // Group DApps by chain and category
            const groupedData = {};
            masterData.forEach((dapp) => {
                // Group by chain
                const chainKey = dapp.chain.toLowerCase().replace(/\s/g, '-');
                if (!groupedData[chainKey]) {
                    groupedData[chainKey] = [];
                }
                groupedData[chainKey].push(dapp);
                // Group by category
                const categoryKey = dapp.category.toLowerCase().replace(/\s/g, '-');
                if (!groupedData[categoryKey]) {
                    groupedData[categoryKey] = [];
                }
                groupedData[categoryKey].push(dapp);
                // Group by chain-category combination
                const chainCategoryKey = `${chainKey}-${categoryKey}`;
                if (!groupedData[chainCategoryKey]) {
                    groupedData[chainCategoryKey] = [];
                }
                groupedData[chainCategoryKey].push(dapp);
            });
            // Write grouped data to individual JSON files
            for (const key in groupedData) {
                if (Object.prototype.hasOwnProperty.call(groupedData, key)) {
                    const filePath = path_1.default.join(collectionsDirPath, `${key}.json`);
                    await fs_extra_1.default.writeFile(filePath, JSON.stringify(groupedData[key], null, 2), 'utf-8');
                    fastify.log.info(`Created ${key}.json in collections.`);
                }
            }
            return reply.status(200).send({
                message: 'Master data distilled into micro-JSONs.',
                collectionsCreated: Object.keys(groupedData).length + 1, // +1 for all.json
            });
        }
        catch (error) {
            fastify.log.error(error, 'Error in /api/distill:');
            return reply.status(500).send({ message: 'Internal Server Error', error: (error instanceof Error ? error.message : String(error)) });
        }
    });
}
