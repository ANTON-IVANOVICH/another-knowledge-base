import { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    // authenticate — это ваш декорированный хук
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }

  interface FastifyRequest {
    // fastify-jwt автоматически добавляет метод request.jwtVerify()
    // и после verify кладёт в request.user payload: User
    user: import("@prisma/client").Pick<User, "id" | "email" | "name" | "role">;
  }
}
