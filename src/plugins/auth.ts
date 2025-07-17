import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

export default fp(async (fastify) => {
  const prisma = new PrismaClient();

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const token = request.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          throw new Error("Missing authentication token");
        }

        const decoded = fastify.jwt.verify(token) as any;

        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
        });

        if (!user) {
          throw new Error("User not found");
        }

        request.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      } catch (err: any) {
        reply.code(401).send({ error: "Unauthorized", message: err.message });
      }
    }
  );
});
