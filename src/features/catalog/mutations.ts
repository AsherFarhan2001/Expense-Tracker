import "server-only";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { categories, items } from "@/db/schema";
import type { CategoryColor } from "@/lib/palette";
import type { MoveDirection } from "./schemas";

export type MutationResult =
  { ok: true; id: string } | { ok: false; error: string };

const sameName = (
  column: typeof categories.name | typeof items.name,
  value: string,
) => sql`lower(${column}) = lower(${value})`;

export async function createCategory(
  db: Database,
  input: { name: string; color: CategoryColor },
): Promise<MutationResult> {
  const [clash] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(sameName(categories.name, input.name))
    .limit(1);
  if (clash)
    return {
      ok: false,
      error: `You already have a category called "${input.name}".`,
    };

  const [last] = await db
    .select({
      max: sql<number>`coalesce(max(${categories.sortOrder}), -1)::int`,
    })
    .from(categories);
  const [row] = await db
    .insert(categories)
    .values({ ...input, sortOrder: (last?.max ?? -1) + 1 })
    .returning({ id: categories.id });
  return row
    ? { ok: true, id: row.id }
    : { ok: false, error: "Couldn't create the category." };
}

export async function updateCategory(
  db: Database,
  id: string,
  patch: { name?: string; color?: CategoryColor },
): Promise<MutationResult> {
  if (patch.name) {
    const [clash] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(sameName(categories.name, patch.name), ne(categories.id, id)))
      .limit(1);
    if (clash)
      return {
        ok: false,
        error: `You already have a category called "${patch.name}".`,
      };
  }
  const rows = await db
    .update(categories)
    .set(patch)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });
  return rows[0]
    ? { ok: true, id }
    : { ok: false, error: "That category no longer exists." };
}

export async function setCategoryArchived(
  db: Database,
  id: string,
  archived: boolean,
): Promise<MutationResult> {
  const rows = await db
    .update(categories)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(categories.id, id))
    .returning({ id: categories.id });
  return rows[0]
    ? { ok: true, id }
    : { ok: false, error: "That category no longer exists." };
}

export async function createItem(
  db: Database,
  input: {
    categoryId: string;
    name: string;
    isFixed: boolean;
    amountMode: "variable" | "recurring";
  },
): Promise<MutationResult> {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, input.categoryId))
    .limit(1);
  if (!category) return { ok: false, error: "That category no longer exists." };

  const [clash] = await db
    .select({ id: items.id })
    .from(items)
    .where(
      and(
        eq(items.categoryId, input.categoryId),
        sameName(items.name, input.name),
      ),
    )
    .limit(1);
  if (clash)
    return { ok: false, error: `"${input.name}" is already in this category.` };

  const [last] = await db
    .select({ max: sql<number>`coalesce(max(${items.sortOrder}), -1)::int` })
    .from(items)
    .where(eq(items.categoryId, input.categoryId));
  const [row] = await db
    .insert(items)
    .values({ ...input, sortOrder: (last?.max ?? -1) + 1 })
    .returning({ id: items.id });
  return row
    ? { ok: true, id: row.id }
    : { ok: false, error: "Couldn't add the item." };
}

export async function updateItem(
  db: Database,
  id: string,
  patch: {
    name?: string;
    isFixed?: boolean;
    amountMode?: "variable" | "recurring";
  },
): Promise<MutationResult> {
  const [current] = await db
    .select({ categoryId: items.categoryId })
    .from(items)
    .where(eq(items.id, id))
    .limit(1);
  if (!current) return { ok: false, error: "That item no longer exists." };

  if (patch.name) {
    const [clash] = await db
      .select({ id: items.id })
      .from(items)
      .where(
        and(
          eq(items.categoryId, current.categoryId),
          sameName(items.name, patch.name),
          ne(items.id, id),
        ),
      )
      .limit(1);
    if (clash)
      return {
        ok: false,
        error: `"${patch.name}" is already in this category.`,
      };
  }
  await db.update(items).set(patch).where(eq(items.id, id));
  return { ok: true, id };
}

export async function setItemArchived(
  db: Database,
  id: string,
  archived: boolean,
): Promise<MutationResult> {
  const rows = await db
    .update(items)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(items.id, id))
    .returning({ id: items.id });
  return rows[0]
    ? { ok: true, id }
    : { ok: false, error: "That item no longer exists." };
}

/** Swap with the neighbour in display order, then renumber 0..n so order stays dense. */
function reorder<T extends { id: string }>(
  rows: T[],
  id: string,
  direction: MoveDirection,
): T[] | null {
  const index = rows.findIndex((r) => r.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return null;
  const next = [...rows];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

export async function moveCategory(
  db: Database,
  id: string,
  direction: MoveDirection,
): Promise<MutationResult> {
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const next = reorder(rows, id, direction);
  if (!next) return { ok: true, id };
  for (const [sortOrder, row] of next.entries()) {
    await db
      .update(categories)
      .set({ sortOrder })
      .where(eq(categories.id, row.id));
  }
  return { ok: true, id };
}

export async function moveItem(
  db: Database,
  id: string,
  direction: MoveDirection,
): Promise<MutationResult> {
  const [current] = await db
    .select({ categoryId: items.categoryId })
    .from(items)
    .where(eq(items.id, id))
    .limit(1);
  if (!current) return { ok: false, error: "That item no longer exists." };
  const rows = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.categoryId, current.categoryId))
    .orderBy(asc(items.sortOrder), asc(items.name));
  const next = reorder(rows, id, direction);
  if (!next) return { ok: true, id };
  for (const [sortOrder, row] of next.entries()) {
    await db.update(items).set({ sortOrder }).where(eq(items.id, row.id));
  }
  return { ok: true, id };
}
