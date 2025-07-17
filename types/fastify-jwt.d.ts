// расширяем payload у fastify-jwt
import "@fastify/jwt";
import { FastifyJWT } from "@fastify/jwt";
import { User } from "@prisma/client";

declare module "@fastify/jwt" {
  // Перекрываем интерфейс FastifyJWT (payload для request.user)
  interface FastifyJWT {
    // после request.jwtVerify() у request.user будет именно этот тип
    payload: Partial<User>;
  }
}
