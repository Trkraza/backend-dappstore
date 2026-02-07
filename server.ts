// D:\projects\dapp-store\backend-dappstore\server.ts

import Fastify, { FastifyInstance } from 'fastify';

import sensible from '@fastify/sensible';

import uploadRoutes from './routes/upload';

import distillRoutes from './routes/distill';



export function build(): FastifyInstance {

  const fastify = Fastify({

    logger: true

  });



  fastify.register(sensible);



  // Register API routes

  fastify.register(uploadRoutes);

  fastify.register(distillRoutes);



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

    } catch (err) {

      fastify.log.error(err);

      process.exit(1);

    }

  };

  start();

}
