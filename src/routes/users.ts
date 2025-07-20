import { FastifyInstance, FastifyRequest } from "fastify";
import { UserService } from "../services/user";
import { SignupInput, LoginInput } from "../types/auth";
import {
  loginJSONSchema,
  loginResponseJSONSchema,
  signupJSONSchema,
  userResponseJSONSchema,
  usersListResponseJSONSchema,
} from "../schemas/user";
import { errorResponseJSONSchema } from "../schemas";

export default async function userRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify.prisma);

  fastify.post(
    "/users/signup",
    {
      schema: {
        description: "Регистрация нового пользователя",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        body: signupJSONSchema,
        response: {
          201: userResponseJSONSchema,
          400: errorResponseJSONSchema,
          409: errorResponseJSONSchema,
        },
      },
    },
    async (request) => {
      const data = request.body as SignupInput;
      return userService.signup(data.email, data.password, data.name);
    }
  );

  fastify.post(
    "/users/login",
    {
      schema: {
        description: "Авторизация пользователя",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        body: loginJSONSchema,
        response: {
          200: loginResponseJSONSchema,
          401: errorResponseJSONSchema,
        },
      },
    },
    async (request, reply) => {
      const data = request.body as LoginInput;
      const result = await userService.login(data.email, data.password);
      return result;
    }
  );

  fastify.get(
    "/users/me",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Получить информацию о себе",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: userResponseJSONSchema,
          401: errorResponseJSONSchema,
        },
      },
    },
    async (request) => {
      const userId = request.user.id;
      return userService.getUserById(userId);
    }
  );

  fastify.get(
    "/users",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Получить список пользователей (только админ)",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: usersListResponseJSONSchema,
          403: errorResponseJSONSchema,
        },
      },
    },
    async (request, reply) => {
      if (request.user.role !== "ADMIN") {
        reply.code(403).send({
          error: "Forbidden",
          message: "Admin access required",
        });
        return;
      }

      return userService.getAllUsers();
    }
  );

  fastify.delete(
    "/users/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Удалить пользователя (только админ)",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: userResponseJSONSchema,
          403: errorResponseJSONSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      if (request.user.role !== "ADMIN") {
        reply.code(403).send({
          error: "Forbidden",
          message: "Admin access required",
        });
        return;
      }

      await userService.deleteUser(request.params.id);
      return { message: "User deleted successfully" };
    }
  );
}

// curl -X POST http://localhost:3000/api/articles \
//   -H "Content-Type: application/json" \
//   -d '{"title":"Test","content":"Content"}'
// # Должна быть ошибка 401

// # Сначала создайте приватную статью от имени пользователя
// curl http://localhost:3000/api/articles/2
// # Для приватной статьи должна быть ошибка 403

// curl -X PUT http://localhost:3000/api/articles/1 \
//   -H "Authorization: Bearer <USER2_TOKEN>" \
//   -H "Content-Type: application/json" \
//   -d '{"title":"Hacked"}'
// # Должна быть ошибка 403

// curl -H "Authorization: Bearer <USER_TOKEN>" http://localhost:3000/api/users
// # Должна быть ошибка 403
