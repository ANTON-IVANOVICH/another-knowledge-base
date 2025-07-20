import fastify from "fastify";
import cors from "@fastify/cors";
import prismaPlugin from "./plugins/prisma";
import authPlugin from "./plugins/auth";
import swaggerPlugin from "./plugins/swagger";
import articleRoutes from "./routes/articles";
import userRoutes from "./routes/users";
import { initEnv } from "./env";
initEnv();

const server = fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  },
});

server.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

server.register(prismaPlugin);
server.register(authPlugin);

// server.setValidatorCompiler(({ schema }) => {
//   console.log("COMPILING SCHEMA:", schema);
//   return ajv.compile(schema);
// });

server.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;

  if (error.validation) {
    reply.status(400).send({
      error: "Validation Error",
      message: error.message,
      details: error.validation,
    });
    return;
  }

  reply.status(statusCode).send({
    error: error.name || "Internal Server Error",
    message: error.message || "Something went wrong",
    code: statusCode,
  });
});

server.after(() => {
  server.get(
    "/protected",
    {
      preHandler: [server.authenticate],
    },
    async (request, reply) => {
      return { message: "You are authenticated!" };
    }
  );

  server.post("/auth-test", async (request) => {
    const token = server.jwt.sign({
      id: "cixne9w3k0000z5sd9f7y3c6r",
      email: "test@example.com",
      role: "ADMIN",
    });
    return { token };
  });
});

server.register(articleRoutes, { prefix: "/api" });
server.register(userRoutes, { prefix: "/api" });

server.addHook("onSend", (request, reply, payload, done) => {
  console.debug("RESPONSE PAYLOAD:", payload);
  done(null, payload);
});

server.get("/users", async () => {
  return server.prisma.user.findMany();
});

server.get("/health", async () => {
  return { status: "OK", timestamp: new Date().toISOString() };
});

server.register(swaggerPlugin);

const start = async () => {
  try {
    const port = Number(process.env.PORT);
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`Server started on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
