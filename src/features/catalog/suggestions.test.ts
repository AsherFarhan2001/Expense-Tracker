import { describe, expect, it } from "vitest";
import { missingCountrySuggestions } from "./suggestions";

describe("missingCountrySuggestions", () => {
  it("offers Pakistan and Saudi Arabia when only Qatar exists", () => {
    expect(missingCountrySuggestions(["Qatar"])).toEqual([
      "Pakistan",
      "Saudi Arabia",
    ]);
  });

  it("hides a country you already have, whatever the case or spacing", () => {
    expect(missingCountrySuggestions(["Qatar", "  pakistan "])).toEqual([
      "Saudi Arabia",
    ]);
    expect(missingCountrySuggestions(["SAUDI ARABIA"])).toEqual(["Pakistan"]);
  });

  it("treats short and common spellings as the same country", () => {
    expect(missingCountrySuggestions(["Saudi"])).toEqual(["Pakistan"]);
    expect(missingCountrySuggestions(["Saudia"])).toEqual(["Pakistan"]);
    expect(missingCountrySuggestions(["KSA"])).toEqual(["Pakistan"]);
    expect(missingCountrySuggestions(["Pak"])).toEqual(["Saudi Arabia"]);
  });

  it("hides a country when a category starts with its name", () => {
    expect(
      missingCountrySuggestions(["Pakistan family", "Saudi trip"]),
    ).toEqual([]);
  });

  it("doesn't hide a country for an unrelated name that merely contains it", () => {
    expect(missingCountrySuggestions(["Pakistani food"])).toEqual([
      "Pakistan",
      "Saudi Arabia",
    ]);
  });
});
