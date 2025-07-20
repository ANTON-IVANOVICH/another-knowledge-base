import zodToJsonSchema from "zod-to-json-schema";
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

const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().optional(),
    role: z.string(),
  }),
});

const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().optional(),
  role: z.string(),
  createdAt: z.string().datetime(),
});

const usersListResponseSchema = z.object({
  data: z.array(userResponseSchema),
});

const usersListResponseJSONSchema = zodToJsonSchema(usersListResponseSchema, {
  name: "UserResponse",
});

const userResponseJSONSchema = zodToJsonSchema(userResponseSchema, {
  name: "UserResponse",
});

const loginResponseJSONSchema = zodToJsonSchema(loginResponseSchema, {
  name: "LoginResponse",
});

const signupJSONSchema = zodToJsonSchema(signupSchema, {
  name: "Signup",
});

const loginJSONSchema = zodToJsonSchema(loginSchema, {
  name: "Login",
});

export {
  signupSchema,
  loginSchema,
  loginResponseSchema,
  userResponseSchema,
  usersListResponseSchema,
  userResponseJSONSchema,
  loginResponseJSONSchema,
  signupJSONSchema,
  loginJSONSchema,
  usersListResponseJSONSchema,
};
