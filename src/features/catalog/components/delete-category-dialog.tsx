"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Currency } from "@/lib/money";
import { archiveCategory, deleteCategory } from "../actions";
import { describeCategoryDeletion } from "../deletion";
import type { CategoryUsage } from "../types";

/** A snapshot taken when the dialog opens, so the text doesn't change while it closes. */
export type CategoryToDelete = {
  id: string;
  name: string;
  archived: boolean;
  /** All items in the category, archived ones included. */
  itemCount: number;
  usage: CategoryUsage | undefined;
};

type DeleteCategoryDialogProps = {
  category: CategoryToDelete;
  currency: Currency;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Confirms a permanent category delete, saying exactly what goes with it.
 * Offers "Archive instead" when the category still has expenses.
 * Shared by the month page and Settings.
 */
export function DeleteCategoryDialog({
  category,
  currency,
  open,
  onOpenChange,
}: DeleteCategoryDialogProps) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"delete" | "archive" | null>(null);
  const text = describeCategoryDeletion({ ...category, currency });

  const remove = () =>
    startTransition(async () => {
      setBusy("delete");
      const result = await deleteCategory({ id: category.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      toast.success(`Deleted ${category.name}`);
    });

  const archive = () =>
    startTransition(async () => {
      setBusy("archive");
      const result = await archiveCategory({
        id: category.id,
        archived: true,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      toast.success(`Archived ${category.name}`);
    });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{text.title}</AlertDialogTitle>
          <AlertDialogDescription>{text.body}</AlertDialogDescription>
          {text.offerArchive && (
            <p className="text-sm text-muted-foreground">
              To hide it from new months but keep past months as they are,
              archive it instead.
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          {text.offerArchive && (
            <Button variant="outline" disabled={pending} onClick={archive}>
              {pending && busy === "archive" ? "Archiving…" : "Archive instead"}
            </Button>
          )}
          <Button variant="destructive" disabled={pending} onClick={remove}>
            <Trash2 data-icon="inline-start" />
            {pending && busy === "delete" ? "Deleting…" : "Delete permanently"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
