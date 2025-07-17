import fastify from "fastify";
import cors from "@fastify/cors";
import prismaPlugin from "./plugins/prisma";
import swaggerPlugin from "./plugins/swagger";
import authPlugin from "./plugins/auth";
import articleRoutes from "./routes/articles";
import { initEnv } from "./env";
import userRoutes from "./routes/users";
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
server.register(swaggerPlugin);
server.register(authPlugin);

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

server.get("/users", async () => {
  return server.prisma.user.findMany();
});

server.get("/health", async () => {
  return { status: "OK", timestamp: new Date().toISOString() };
});

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
