"use strict";
// D:\projects\dapp-store\backend-dappstore\server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = build;
const fastify_1 = __importDefault(require("fastify"));
const sensible_1 = __importDefault(require("@fastify/sensible"));
const distill_1 = __importDefault(require("./routes/distill")); // Import the new distill routes
function build() {
    const fastify = (0, fastify_1.default)({
        logger: true
    });
    fastify.register(sensible_1.default);
    // Register API routes
    fastify.register(distill_1.default); // Register the new distill route
    fastify.get('/', async (request, reply) => {
        return { message: 'Fastify Backend API is running!' };
    });
    return fastify;
}
if (require.main === module) {
    const fastify = build();
    const start = async () => {
        try {
            const address = fastify.server.address();
            const port = typeof address === 'object' && address !== null ? address.port : 'unknown';
            console.log(`Server listening on port ${port}`);
            // Graceful shutdown
            const signals = ['SIGTERM', 'SIGINT'];
            for (const signal of signals) {
                process.on(signal, async () => {
                    console.log(`Received ${signal}. Shutting down server...`);
                    await fastify.close();
                    console.log('Server shut down gracefully.');
                    process.exit(0);
                });
            }
        }
        catch (err) {
            fastify.log.error(err);
            process.exit(1);
        }
    };
    start();
}
