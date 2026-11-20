import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const currencyEnum = pgEnum("currency", ["QAR", "PKR"]);
export const amountModeEnum = pgEnum("amount_mode", ["variable", "recurring"]);
export const rateSourceEnum = pgEnum("rate_source", ["auto", "manual"]);

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => timestamptz("created_at").notNull().defaultNow();
const money = (name: string) => bigint(name, { mode: "number" });
const rate = (name: string) => numeric(name, { precision: 18, scale: 6 });

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** Palette key, e.g. "maroon" — mapped to theme colors in the UI. */
    color: text("color").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamptz("archived_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("categories_name_unique").on(sql`lower(${t.name})`)],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    /** Shown on every month's screen, even with no entries. */
    isFixed: boolean("is_fixed").notNull().default(true),
    /** "recurring" items suggest last month's amount for confirmation. */
    amountMode: amountModeEnum("amount_mode").notNull().default("variable"),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamptz("archived_at"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("items_category_name_unique").on(
      t.categoryId,
      sql`lower(${t.name})`,
    ),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    /** Calendar day in Asia/Qatar. */
    spentOn: date("spent_on", { mode: "string" }).notNull(),
    /** Amount as entered, in minor units of `currency`. */
    amountMinor: money("amount_minor").notNull(),
    currency: currencyEnum("currency").notNull(),
    /** PKR per 1 QAR on the day the expense was saved. */
    pkrPerQar: rate("pkr_per_qar").notNull(),
    rateSource: rateSourceEnum("rate_source").notNull(),
    amountQarMinor: money("amount_qar_minor").notNull(),
    amountPkrMinor: money("amount_pkr_minor").notNull(),
    note: text("note"),
    deletedAt: timestamptz("deleted_at"),
    createdAt: createdAt(),
    updatedAt: timestamptz("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("expenses_spent_on_idx")
      .on(t.spentOn)
      .where(sql`${t.deletedAt} is null`),
    index("expenses_item_spent_on_idx")
      .on(t.itemId, t.spentOn)
      .where(sql`${t.deletedAt} is null`),
    check("expenses_amount_positive", sql`${t.amountMinor} > 0`),
  ],
);

export const fxRates = pgTable("fx_rates", {
  rateDate: date("rate_date", { mode: "string" }).primaryKey(),
  pkrPerQar: rate("pkr_per_qar").notNull(),
  source: text("source").notNull(),
  fetchedAt: timestamptz("fetched_at").notNull().defaultNow(),
});

export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    defaultCurrency: currencyEnum("default_currency").notNull().default("QAR"),
    displayCurrency: currencyEnum("display_currency").notNull().default("QAR"),
    /** First month the app tracks, "YYYY-MM". */
    startMonth: text("start_month").notNull().default("2026-12"),
    updatedAt: timestamptz("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check("settings_singleton", sql`${t.id} = 1`)],
);

export const pinAttempts = pgTable(
  "pin_attempts",
  {
    id: integer("id").primaryKey().default(1),
    failedCount: integer("failed_count").notNull().default(0),
    windowStart: timestamptz("window_start").notNull().defaultNow(),
    lockedUntil: timestamptz("locked_until"),
  },
  (t) => [check("pin_attempts_singleton", sql`${t.id} = 1`)],
);

export type Category = typeof categories.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Settings = typeof settings.$inferSelect;
