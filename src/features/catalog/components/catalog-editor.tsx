"use client";

import {
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Archive,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  startTransition,
  useOptimistic,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CatalogCategory, CatalogItem } from "@/features/expenses/types";
import type { ActionResult } from "@/lib/action-result";
import type { Currency } from "@/lib/money";
import {
  categoryColor,
  nextCategoryColor,
  type CategoryColor,
} from "@/lib/palette";
import { cn } from "@/lib/utils";
import * as actions from "../actions";
import type { CategoryUsageMap } from "../types";
import { ColorPicker } from "./color-picker";
import {
  DeleteCategoryDialog,
  type CategoryToDelete,
} from "./delete-category-dialog";
import { InlineNameForm } from "./inline-name-form";

type Patch =
  | { kind: "category"; id: string; patch: Partial<CatalogCategory> }
  | { kind: "item"; id: string; patch: Partial<CatalogItem> };

function applyPatch(
  catalog: CatalogCategory[],
  change: Patch,
): CatalogCategory[] {
  return catalog.map((category) =>
    change.kind === "category"
      ? category.id === change.id
        ? { ...category, ...change.patch }
        : category
      : {
          ...category,
          items: category.items.map((item) =>
            item.id === change.id ? { ...item, ...change.patch } : item,
          ),
        },
  );
}

/** Runs an action with an optimistic patch; shows the error and rolls back on failure. */
function useCatalogActions(initial: CatalogCategory[]) {
  const [catalog, applyOptimistic] = useOptimistic(initial, applyPatch);
  const run = (
    action: () => Promise<ActionResult<unknown>>,
    optimistic?: Patch,
  ) =>
    new Promise<boolean>((resolve) => {
      startTransition(async () => {
        if (optimistic) applyOptimistic(optimistic);
        const result = await action();
        if (!result.ok) toast.error(result.error);
        resolve(result.ok);
      });
    });
  return { catalog, run };
}

export function CatalogEditor({
  catalog: initial,
  usage,
  currency,
}: {
  catalog: CatalogCategory[];
  usage: CategoryUsageMap;
  currency: Currency;
}) {
  const { catalog, run } = useCatalogActions(initial);
  const active = catalog.filter((c) => !c.archived);
  const archived = catalog.filter((c) => c.archived);
  const [deleting, setDeleting] = useState<{
    open: boolean;
    category: CategoryToDelete;
  } | null>(null);
  const askToDelete = (category: CatalogCategory) =>
    setDeleting({
      open: true,
      category: {
        id: category.id,
        name: category.name,
        archived: category.archived,
        itemCount: category.items.length,
        usage: usage[category.id],
      },
    });

  return (
    <div className="grid gap-6">
      {active.map((category, index) => (
        <CategoryPanel
          key={category.id}
          category={category}
          isFirst={index === 0}
          isLast={index === active.length - 1}
          run={run}
          onDelete={() => askToDelete(category)}
        />
      ))}

      <NewCategoryForm usedColors={catalog.map((c) => c.color)} run={run} />

      {archived.length > 0 && (
        <section aria-labelledby="archived-categories" className="grid gap-2">
          <h3
            id="archived-categories"
            className="text-sm font-medium text-muted-foreground"
          >
            Archived categories
          </h3>
          <ul className="grid gap-2">
            {archived.map((category) => (
              <li
                key={category.id}
                className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/[0.06]"
              >
                <span
                  className="size-3 rounded-full opacity-60"
                  style={{ background: categoryColor(category.color) }}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{category.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() =>
                    run(
                      () =>
                        actions.archiveCategory({
                          id: category.id,
                          archived: false,
                        }),
                      {
                        kind: "category",
                        id: category.id,
                        patch: { archived: false },
                      },
                    )
                  }
                >
                  <ArchiveRestore data-icon="inline-start" />
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${category.name}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => askToDelete(category)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {deleting && (
        <DeleteCategoryDialog
          category={deleting.category}
          currency={currency}
          open={deleting.open}
          onOpenChange={(open) =>
            setDeleting((current) => current && { ...current, open })
          }
        />
      )}
    </div>
  );
}

type Run = ReturnType<typeof useCatalogActions>["run"];

function CategoryPanel({
  category,
  isFirst,
  isLast,
  run,
  onDelete,
}: {
  category: CatalogCategory;
  isFirst: boolean;
  isLast: boolean;
  run: Run;
  onDelete: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const activeItems = category.items.filter((i) => !i.archived);
  const archivedItems = category.items.filter((i) => i.archived);
  const headingId = `settings-category-${category.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl bg-card ring-1 ring-foreground/[0.06]"
    >
      <div
        className="flex items-center gap-3 border-b-2 px-4 py-3 sm:px-5"
        style={{ borderColor: categoryColor(category.color) }}
      >
        {renaming ? (
          <InlineNameForm
            initial={category.name}
            label="Category name"
            onCancel={() => setRenaming(false)}
            onSave={async (name) => {
              setRenaming(false);
              await run(
                () => actions.updateCategory({ id: category.id, name }),
                {
                  kind: "category",
                  id: category.id,
                  patch: { name },
                },
              );
            }}
          />
        ) : (
          <h2
            id={headingId}
            className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight"
          >
            {category.name}
          </h2>
        )}
        <span className="hidden text-sm text-muted-foreground tabular-nums sm:inline">
          {activeItems.length} {activeItems.length === 1 ? "item" : "items"}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${category.name} options`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>
              <Pencil /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isFirst}
              onSelect={() =>
                run(() =>
                  actions.moveCategory({ id: category.id, direction: "up" }),
                )
              }
            >
              <ArrowUp /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isLast}
              onSelect={() =>
                run(() =>
                  actions.moveCategory({ id: category.id, direction: "down" }),
                )
              }
            >
              <ArrowDown /> Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="mb-2 text-xs text-muted-foreground">Colour</p>
              <ColorPicker
                label={`${category.name} colour`}
                value={category.color}
                onChange={(color) =>
                  run(
                    () => actions.updateCategory({ id: category.id, color }),
                    {
                      kind: "category",
                      id: category.id,
                      patch: { color },
                    },
                  )
                }
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() =>
                run(
                  () =>
                    actions.archiveCategory({
                      id: category.id,
                      archived: true,
                    }),
                  {
                    kind: "category",
                    id: category.id,
                    patch: { archived: true },
                  },
                )
              }
            >
              <Archive /> Archive category
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 /> Delete category…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-4 pb-4 sm:px-5">
        {activeItems.length > 0 ? (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_2rem] gap-3 pt-3 pb-1 text-xs text-muted-foreground sm:grid">
              <span>Item</span>
              <span className="text-center">Every month</span>
              <span className="text-center">Same amount</span>
              <span />
            </div>
            <ul className="divide-y divide-border/70">
              {activeItems.map((item, index) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isFirst={index === 0}
                  isLast={index === activeItems.length - 1}
                  run={run}
                />
              ))}
            </ul>
          </>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            No items yet. Add what you spend on in {category.name}.
          </p>
        )}

        <NewItemForm
          categoryId={category.id}
          categoryName={category.name}
          run={run}
        />

        {archivedItems.length > 0 && (
          <div className="mt-3">
            <Button
              variant="link"
              size="sm"
              className="h-auto px-0 text-muted-foreground"
              aria-expanded={showArchived}
              onClick={() => setShowArchived((v) => !v)}
            >
              {showArchived ? "Hide" : "Show"} archived items (
              {archivedItems.length})
            </Button>
            {showArchived && (
              <ul className="mt-2 grid gap-1">
                {archivedItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() =>
                        run(
                          () =>
                            actions.archiveItem({
                              id: item.id,
                              archived: false,
                            }),
                          {
                            kind: "item",
                            id: item.id,
                            patch: { archived: false },
                          },
                        )
                      }
                    >
                      <ArchiveRestore data-icon="inline-start" />
                      Restore
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ItemRow({
  item,
  isFirst,
  isLast,
  run,
}: {
  item: CatalogItem;
  isFirst: boolean;
  isLast: boolean;
  run: Run;
}) {
  const [renaming, setRenaming] = useState(false);
  const patch = (p: Partial<CatalogItem>) => ({
    kind: "item" as const,
    id: item.id,
    patch: p,
  });

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-x-3 gap-y-2 py-2.5 sm:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_2rem]">
      {renaming ? (
        <InlineNameForm
          initial={item.name}
          label={`New name for ${item.name}`}
          onCancel={() => setRenaming(false)}
          onSave={async (name) => {
            setRenaming(false);
            await run(
              () => actions.updateItem({ id: item.id, name }),
              patch({ name }),
            );
          }}
        />
      ) : (
        <span className="truncate">{item.name}</span>
      )}

      <label className="col-start-1 row-start-2 flex items-center gap-2 text-sm text-muted-foreground sm:col-start-auto sm:row-start-auto sm:justify-center">
        <Switch
          checked={item.isFixed}
          aria-label={`Show ${item.name} every month`}
          onCheckedChange={(isFixed) =>
            run(
              () => actions.updateItem({ id: item.id, isFixed }),
              patch({ isFixed }),
            )
          }
        />
        <span className="sm:sr-only">Every month</span>
      </label>
      <label className="col-start-1 row-start-3 flex items-center gap-2 text-sm text-muted-foreground sm:col-start-auto sm:row-start-auto sm:justify-center">
        <Switch
          checked={item.amountMode === "recurring"}
          aria-label={`Suggest last month's ${item.name} amount`}
          onCheckedChange={(on) => {
            const amountMode = on ? "recurring" : "variable";
            run(
              () => actions.updateItem({ id: item.id, amountMode }),
              patch({ amountMode }),
            );
          }}
        />
        <span className="sm:sr-only">Same amount</span>
      </label>

      <div className="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${item.name} options`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>
              <Pencil /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isFirst}
              onSelect={() =>
                run(() => actions.moveItem({ id: item.id, direction: "up" }))
              }
            >
              <ArrowUp /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isLast}
              onSelect={() =>
                run(() => actions.moveItem({ id: item.id, direction: "down" }))
              }
            >
              <ArrowDown /> Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() =>
                run(
                  () => actions.archiveItem({ id: item.id, archived: true }),
                  patch({ archived: true }),
                )
              }
            >
              <Archive /> Archive item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function NewItemForm({
  categoryId,
  categoryName,
  run,
}: {
  categoryId: string;
  categoryName: string;
  run: Run;
}) {
  const [name, setName] = useState("");
  const [isFixed, setIsFixed] = useState(true);
  const inputId = `new-item-${categoryId}`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const saved = await run(() =>
      actions.createItem({
        categoryId,
        name: trimmed,
        isFixed,
        amountMode: "variable",
      }),
    );
    if (saved) setName("");
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
      <Label htmlFor={inputId} className="sr-only">
        New item in {categoryName}
      </Label>
      <Input
        id={inputId}
        value={name}
        maxLength={40}
        placeholder="New item, e.g. Internet"
        onChange={(e) => setName(e.target.value)}
        className="h-8 min-w-40 flex-1"
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch
          checked={isFixed}
          onCheckedChange={setIsFixed}
          aria-label="Show the new item every month"
        />
        Every month
      </label>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        disabled={!name.trim()}
      >
        <Plus data-icon="inline-start" />
        Add item
      </Button>
    </form>
  );
}

function NewCategoryForm({
  usedColors,
  run,
}: {
  usedColors: string[];
  run: Run;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<CategoryColor>(() =>
    nextCategoryColor(usedColors),
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const saved = await run(() =>
      actions.createCategory({ name: trimmed, color }),
    );
    if (saved) {
      toast.success(`Added ${trimmed}. Now add its items.`);
      setName("");
      setColor(nextCategoryColor([...usedColors, color]));
    }
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "grid gap-4 rounded-2xl border border-dashed border-foreground/15 p-4 sm:p-5",
      )}
    >
      <div className="grid gap-1">
        <h2 className="font-semibold tracking-tight">Add a category</h2>
        <p className="text-sm text-muted-foreground">
          Group spending you want to see separately, like Pakistan or Saudi.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-48 flex-1 gap-1.5">
          <Label htmlFor="new-category-name">Name</Label>
          <Input
            id="new-category-name"
            value={name}
            maxLength={40}
            placeholder="e.g. Pakistan"
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
        </div>
        <Button type="submit" disabled={!name.trim()} className="h-9">
          <Plus data-icon="inline-start" />
          Add category
        </Button>
      </div>
      <div className="grid gap-1.5">
        <span className="text-sm font-medium">Colour</span>
        <ColorPicker
          label="New category colour"
          value={color}
          onChange={setColor}
        />
      </div>
    </form>
  );
}

export function CatalogLegend() {
  return (
    <dl className="grid gap-2 text-sm">
      <div>
        <dt className="font-medium">Every month</dt>
        <dd className="text-muted-foreground">
          The item appears on each month&apos;s list, even before you log
          anything.
        </dd>
      </div>
      <div>
        <dt className="font-medium">Same amount</dt>
        <dd className="text-muted-foreground">
          Each new month suggests last month&apos;s amount so you can confirm it
          in one tap.
        </dd>
      </div>
      <div>
        <dt className="font-medium">Archive</dt>
        <dd className="text-muted-foreground">
          Hides it from new months. Past months keep their expenses.
        </dd>
      </div>
    </dl>
  );
}
