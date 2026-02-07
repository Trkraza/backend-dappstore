// D:\projects\dapp-store\backend-dappstore\routes\distill.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs-extra';
import path from 'path';
import { masterSchema, DApp } from '../lib/schema';

const API_KEY = process.env.API_KEY;

export default async function distillRoutes(fastify: FastifyInstance) {
  // Pre-handler for API key authentication
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.headers['x-api-key'] !== API_KEY) {
      reply.status(401).send({ message: 'Unauthorized: Invalid API Key' });
    }
  });

  fastify.post('/api/distill', async (request, reply) => {
    try {
      const masterFilePath = path.join(process.cwd(), 'data', 'master.json');
      const collectionsDirPath = path.join(process.cwd(), 'data', 'collections');

      // Ensure collections directory exists
      await fs.ensureDir(collectionsDirPath);

      // Read master.json
      if (!(await fs.pathExists(masterFilePath))) {
        return reply.status(404).send({ message: 'master.json not found.' });
      }

      const masterFileContent = await fs.readFile(masterFilePath, 'utf-8');
      const masterData = masterSchema.parse(JSON.parse(masterFileContent));

      // Create 'all.json'
      await fs.writeFile(
        path.join(collectionsDirPath, 'all.json'),
        JSON.stringify(masterData, null, 2),
        'utf-8'
      );
      fastify.log.info('Created all.json in collections.');

      // Group DApps by chain and category
      const groupedData: { [key: string]: DApp[] } = {};

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
          const filePath = path.join(collectionsDirPath, `${key}.json`);
          await fs.writeFile(filePath, JSON.stringify(groupedData[key], null, 2), 'utf-8');
          fastify.log.info(`Created ${key}.json in collections.`);
        }
      }

      return reply.status(200).send({
        message: 'Master data distilled into micro-JSONs.',
        collectionsCreated: Object.keys(groupedData).length + 1, // +1 for all.json
      });
    } catch (error) {
      fastify.log.error(error, 'Error in /api/distill:');
      return reply.status(500).send({ message: 'Internal Server Error', error: (error instanceof Error ? error.message : String(error)) });
    }
  });
}