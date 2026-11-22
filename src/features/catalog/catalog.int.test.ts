import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCatalog } from "@/features/expenses/queries";
import { createTestDb, type TestDb } from "@/test/db";
import {
  createCategory,
  createItem,
  moveCategory,
  moveItem,
  setCategoryArchived,
  setItemArchived,
  updateCategory,
  updateItem,
} from "./mutations";

let testDb: TestDb;
beforeEach(async () => {
  testDb = await createTestDb();
});
afterEach(async () => {
  await testDb.close();
});

const idOf = (result: { ok: boolean; id?: string }) => {
  if (!result.ok || !result.id) throw new Error("expected ok");
  return result.id;
};

describe("categories", () => {
  it("creates a category at the end with its items", async () => {
    const pakistan = idOf(
      await createCategory(testDb.db, { name: "Pakistan", color: "teal" }),
    );
    idOf(
      await createItem(testDb.db, {
        categoryId: pakistan,
        name: "Family support",
        isFixed: true,
        amountMode: "recurring",
      }),
    );

    const catalog = await getCatalog(testDb.db);
    expect(catalog.map((c) => c.name)).toEqual(["Qatar", "Pakistan"]);
    expect(catalog[1]?.items).toEqual([
      expect.objectContaining({
        name: "Family support",
        isFixed: true,
        amountMode: "recurring",
      }),
    ]);
  });

  it("rejects duplicate names regardless of case", async () => {
    const result = await createCategory(testDb.db, {
      name: "qatar",
      color: "teal",
    });
    expect(result).toEqual({
      ok: false,
      error: 'You already have a category called "Qatar".',
    });
  });

  it("points to Settings when the name belongs to an archived category", async () => {
    const saudi = idOf(
      await createCategory(testDb.db, { name: "Saudi Arabia", color: "amber" }),
    );
    await setCategoryArchived(testDb.db, saudi, true);
    expect(
      await createCategory(testDb.db, { name: "saudi arabia", color: "teal" }),
    ).toEqual({
      ok: false,
      error: '"Saudi Arabia" is archived. Restore it in Settings.',
    });
  });

  it("renames, recolours, archives and restores", async () => {
    const saudi = idOf(
      await createCategory(testDb.db, { name: "Saudi", color: "amber" }),
    );
    await updateCategory(testDb.db, saudi, {
      name: "Saudi Arabia",
      color: "olive",
    });
    await setCategoryArchived(testDb.db, saudi, true);

    let catalog = await getCatalog(testDb.db);
    expect(catalog[1]).toMatchObject({
      name: "Saudi Arabia",
      color: "olive",
      archived: true,
    });

    await setCategoryArchived(testDb.db, saudi, false);
    catalog = await getCatalog(testDb.db);
    expect(catalog[1]?.archived).toBe(false);
  });

  it("moves categories up and down", async () => {
    const pakistan = idOf(
      await createCategory(testDb.db, { name: "Pakistan", color: "teal" }),
    );
    await moveCategory(testDb.db, pakistan, "up");
    expect((await getCatalog(testDb.db)).map((c) => c.name)).toEqual([
      "Pakistan",
      "Qatar",
    ]);
    await moveCategory(testDb.db, pakistan, "up"); // already first: no-op
    await moveCategory(testDb.db, pakistan, "down");
    expect((await getCatalog(testDb.db)).map((c) => c.name)).toEqual([
      "Qatar",
      "Pakistan",
    ]);
  });
});

describe("items", () => {
  it("updates flags and names, rejecting duplicates within the category", async () => {
    const [qatar] = await getCatalog(testDb.db);
    const tea = qatar!.items.find((i) => i.name === "Tea")!;

    expect(await updateItem(testDb.db, tea.id, { name: "Lunch" })).toEqual({
      ok: false,
      error: '"Lunch" is already in this category.',
    });
    await updateItem(testDb.db, tea.id, { name: "Karak", isFixed: false });

    const updated = (await getCatalog(testDb.db))[0]!.items.find(
      (i) => i.id === tea.id,
    );
    expect(updated).toMatchObject({ name: "Karak", isFixed: false });
  });

  it("rejects a new item whose name is taken, pointing to Settings when archived", async () => {
    const [qatar] = await getCatalog(testDb.db);
    const haircut = qatar!.items.find((i) => i.name === "Haircut")!;
    const item = (name: string) => ({
      categoryId: qatar!.id,
      name,
      isFixed: true,
      amountMode: "variable" as const,
    });

    expect(await createItem(testDb.db, item("lunch"))).toEqual({
      ok: false,
      error: '"Lunch" is already in this category.',
    });
    await setItemArchived(testDb.db, haircut.id, true);
    expect(await createItem(testDb.db, item("Haircut"))).toEqual({
      ok: false,
      error: '"Haircut" is archived in this category. Restore it in Settings.',
    });
  });

  it("archives items and reorders within a category", async () => {
    const [qatar] = await getCatalog(testDb.db);
    const [first, second] = qatar!.items;
    await moveItem(testDb.db, second!.id, "up");
    await setItemArchived(testDb.db, first!.id, true);

    const items = (await getCatalog(testDb.db))[0]!.items;
    expect(items[0]?.id).toBe(second!.id);
    expect(items.find((i) => i.id === first!.id)?.archived).toBe(true);
  });
});
