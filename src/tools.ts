import { z } from "zod";
import { Tool } from "./types";

export function createTool<T>(
  name: string,
  description: string,
  schema: z.ZodType<T>,
  execute: (args: T) => Promise<string | Record<string, any>> | string | Record<string, any>
): Tool<T> {
  return {
    name,
    description,
    schema,
    execute,
  };
}
