/**
 * Countries offered as one-tap categories on the month page. Each is hidden
 * once you have a category that already covers it (archived ones count, since
 * names must stay unique).
 */
const COUNTRY_SUGGESTIONS = [
  { name: "Pakistan", aliases: ["pakistan", "pak", "pk"] },
  { name: "Saudi Arabia", aliases: ["saudi", "saudia", "ksa"] },
] as const;

/** Suggested country categories that don't exist yet, in display order. */
export function missingCountrySuggestions(
  existingNames: readonly string[],
): string[] {
  const taken = existingNames.flatMap((name) => {
    const normalized = name.trim().toLowerCase();
    const firstWord = normalized.split(/\s+/)[0] ?? "";
    return [normalized, firstWord];
  });
  return COUNTRY_SUGGESTIONS.filter(
    ({ name, aliases }) =>
      !taken.includes(name.toLowerCase()) &&
      !aliases.some((alias) => taken.includes(alias)),
  ).map(({ name }) => name);
}
