// D:\projects\dapp-store\backend-dappstore\server.ts

import Fastify, { FastifyInstance } from 'fastify';

import sensible from '@fastify/sensible';

import distillRoutes from './routes/distill'; // Import the new distill routes



export function build(): FastifyInstance {

  const fastify = Fastify({

    logger: true

  });



  fastify.register(sensible);



  // Register API routes

  fastify.register(distillRoutes); // Register the new distill route







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

  

      } catch (err) {

        fastify.log.error(err);

        process.exit(1);

      }

    };

    start();

  }
