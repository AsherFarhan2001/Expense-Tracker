import { z } from "zod";
import { CATEGORY_COLORS } from "@/lib/palette";

const name = z
  .string()
  .trim()
  .min(1, "Enter a name")
  .max(40, "Keep the name under 40 characters");

export const createCategorySchema = z.object({
  name,
  color: z.enum(CATEGORY_COLORS),
});

export const updateCategorySchema = z.object({
  id: z.uuid(),
  name: name.optional(),
  color: z.enum(CATEGORY_COLORS).optional(),
});

export const createItemSchema = z.object({
  categoryId: z.uuid(),
  name,
  isFixed: z.boolean().default(true),
  amountMode: z.enum(["variable", "recurring"]).default("variable"),
});

export const updateItemSchema = z.object({
  id: z.uuid(),
  name: name.optional(),
  isFixed: z.boolean().optional(),
  amountMode: z.enum(["variable", "recurring"]).optional(),
});

export const categoryIdSchema = z.object({
  id: z.uuid(),
});

export const archiveSchema = z.object({
  id: z.uuid(),
  archived: z.boolean(),
});

export const moveSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["up", "down"]),
});

export type MoveDirection = z.infer<typeof moveSchema>["direction"];
