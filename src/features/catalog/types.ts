/** What deleting a category would remove: its live expenses and their total. */
export type CategoryUsage = {
  expenseCount: number;
  qarMinor: number;
  pkrMinor: number;
};

/** Usage by category id. Categories with nothing logged are absent. */
export type CategoryUsageMap = Record<string, CategoryUsage>;
