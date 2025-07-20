import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(import("@fastify/swagger"), {
    openapi: {
      info: {
        title: "My API",
        description: "API для статей и пользователей",
        version: "1.0.0",
      },
      servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await fastify.register(import("@fastify/swagger-ui"), {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
    },
    // routePrefix: "/docs",
    // uiConfig: {
    //   docExpansion: "full",
    //   deepLinking: false,
    // },
    // staticCSP: true,
    // transformStaticCSP: (header) => header,
    // Для сервера с SSL:
    // hideUntagged: true,
  });
});
