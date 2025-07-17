import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

export default fp(async (fastify) => {
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "Another Knowledge Base API",
        description: "API documentation for the Another Knowledge Base service",
        version: "1.0.0",
      },
      externalDocs: {
        url: "https://github.com/ANTON-IVANOVICH/another-knowledge-base",
        description: "GitHub repository",
      },
      //   host: "localhost:3000",
      //   schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
      securityDefinitions: {
        bearerAuth: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
          description:
            'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    staticCSP: true,
    transformSpecificationClone: true,
  });
});
