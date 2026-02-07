"use strict";
// D:\projects\dapp-store\backend-dappstore\routes\distill.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = distillRoutes;
const distill_1 = require("../src/scripts/distill"); // Import the script function
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
            console.log('API /api/distill called. Triggering data distillation script...');
            await (0, distill_1.distillDAppData)(); // Execute the script
            reply.status(200).send({ message: 'Data distillation process initiated successfully.' });
        }
        catch (error) {
            fastify.log.error(error, 'Error during /api/distill API call:');
            reply.status(500).send({ message: 'Internal Server Error', error: (error instanceof Error ? error.message : String(error)) });
        }
    });
}
