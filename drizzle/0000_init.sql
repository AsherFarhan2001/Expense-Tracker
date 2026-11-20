CREATE TYPE "public"."amount_mode" AS ENUM('variable', 'recurring');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('QAR', 'PKR');--> statement-breakpoint
CREATE TYPE "public"."rate_source" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"spent_on" date NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" "currency" NOT NULL,
	"pkr_per_qar" numeric(18, 6) NOT NULL,
	"rate_source" "rate_source" NOT NULL,
	"amount_qar_minor" bigint NOT NULL,
	"amount_pkr_minor" bigint NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_amount_positive" CHECK ("expenses"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"rate_date" date PRIMARY KEY NOT NULL,
	"pkr_per_qar" numeric(18, 6) NOT NULL,
	"source" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_fixed" boolean DEFAULT true NOT NULL,
	"amount_mode" "amount_mode" DEFAULT 'variable' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pin_attempts" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	CONSTRAINT "pin_attempts_singleton" CHECK ("pin_attempts"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"default_currency" "currency" DEFAULT 'QAR' NOT NULL,
	"display_currency" "currency" DEFAULT 'QAR' NOT NULL,
	"start_month" text DEFAULT '2026-12' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_singleton" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_unique" ON "categories" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "expenses_spent_on_idx" ON "expenses" USING btree ("spent_on") WHERE "expenses"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "expenses_item_spent_on_idx" ON "expenses" USING btree ("item_id","spent_on") WHERE "expenses"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "items_category_name_unique" ON "items" USING btree ("category_id",lower("name"));