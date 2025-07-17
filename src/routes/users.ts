import { FastifyInstance } from "fastify";
import { UserService } from "../services/user";
import { SignupInput, LoginInput } from "../types/auth";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default async function userRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify.prisma);

  fastify.post(
    "/users/signup",
    {
      schema: {
        body: signupSchema,
        description: "Register a new user",
        tags: ["Authentication"],
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
        body: loginSchema,
        description: "Authenticate user and get JWT token",
        tags: ["Authentication"],
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
        description: "Get current user information",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => {
      const userId = (request.user as any).id;
      return userService.getUserById(userId);
    }
  );
}
