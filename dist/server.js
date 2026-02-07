"use strict";
// D:\projects\dapp-store\backend-dappstore\server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = build;
const fastify_1 = __importDefault(require("fastify"));
const sensible_1 = __importDefault(require("@fastify/sensible"));
const upload_1 = __importDefault(require("./routes/upload"));
const distill_1 = __importDefault(require("./routes/distill"));
function build() {
    const fastify = (0, fastify_1.default)({
        logger: true
    });
    fastify.register(sensible_1.default);
    // Register API routes
    fastify.register(upload_1.default);
    fastify.register(distill_1.default);
    fastify.get('/', async (request, reply) => {
        return { message: 'Fastify Backend API is running!', api_endpoints: ['/api/upload', '/api/distill'] };
    });
    return fastify;
}
if (require.main === module) {
    const fastify = build();
    const start = async () => {
        try {
            await fastify.listen({ port: 3000 });
        }
        catch (err) {
            fastify.log.error(err);
            process.exit(1);
        }
    };
    start();
}
