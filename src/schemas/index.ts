import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

const errorResponseJSONSchema = zodToJsonSchema(errorResponseSchema, {
  name: "ErrorResponse",
});

export { errorResponseSchema, errorResponseJSONSchema };
