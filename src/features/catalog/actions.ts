"use server";

import { refresh } from "next/cache";
import { getDb } from "@/db/client";
import { requireUnlocked } from "@/features/pin-lock/guard";
import { fail, failFromZod, ok, type ActionResult } from "@/lib/action-result";
import * as mutations from "./mutations";
import {
  archiveSchema,
  createCategorySchema,
  createItemSchema,
  moveSchema,
  updateCategorySchema,
  updateItemSchema,
} from "./schemas";

type IdResult = ActionResult<{ id: string }>;

async function finish(result: mutations.MutationResult): Promise<IdResult> {
  if (!result.ok) return fail(result.error);
  refresh();
  return ok({ id: result.id });
}

export async function createCategory(input: unknown): Promise<IdResult> {
  await requireUnlocked();
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  return finish(await mutations.createCategory(await getDb(), parsed.data));
}

export async function updateCategory(input: unknown): Promise<IdResult> {
  await requireUnlocked();
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  const { id, ...patch } = parsed.data;
  return finish(await mutations.updateCategory(await getDb(), id, patch));
}

export async function archiveCategory(input: unknown): Promise<IdResult> {
  await requireUnlocked();
  const parsed = archiveSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  return finish(
    await mutations.setCategoryArchived(
      await getDb(),
      parsed.data.id,
      parsed.data.archived,
    ),
  );
}

export async function moveCategory(input: unknown): Promise<IdResult> {
  await requireUnlocked();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  return finish(
    await mutations.moveCategory(
      await getDb(),
      parsed.data.id,
      parsed.data.direction,
    ),
  );
}

export async function createItem(input: unknown): Promise<IdResult> {
  await requireUnlocked();
  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  return finish(await mutations.createItem(await getDb(), parsed.data));
}

export async function updateItem(input: unknown): Promise<IdResult> {
  await requireUnlocked();
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  const { id, ...patch } = parsed.data;
  return finish(await mutations.updateItem(await getDb(), id, patch));
}

export async function archiveItem(input: unknown): Promise<IdResult> {
  await requireUnlocked();
  const parsed = archiveSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  return finish(
    await mutations.setItemArchived(
      await getDb(),
      parsed.data.id,
      parsed.data.archived,
    ),
  );
}

export async function moveItem(input: unknown): Promise<IdResult> {
  await requireUnlocked();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  return finish(
    await mutations.moveItem(
      await getDb(),
      parsed.data.id,
      parsed.data.direction,
    ),
  );
}
