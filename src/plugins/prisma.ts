import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

export default fp(async (fastify) => {
  const prisma = new PrismaClient({
    log: ["error", "warn"],
  });

  await prisma.$connect();

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
