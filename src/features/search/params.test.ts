import { describe, expect, it } from "vitest";
import { escapeLike, parseSearchTerms, searchHref } from "./params";

describe("parseSearchTerms", () => {
  it("splits on whitespace and drops empties", () => {
    expect(parseSearchTerms("  umrah   hotel ")).toEqual(["umrah", "hotel"]);
    expect(parseSearchTerms("")).toEqual([]);
    expect(parseSearchTerms(undefined)).toEqual([]);
  });

  it("ignores repeats regardless of case and keeps at most five words", () => {
    expect(parseSearchTerms("Umrah umrah UMRAH")).toEqual(["Umrah"]);
    expect(parseSearchTerms("a b c d e f g")).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  it("cuts very long words", () => {
    expect(parseSearchTerms("x".repeat(80))).toEqual(["x".repeat(40)]);
  });
});

describe("escapeLike", () => {
  it("makes % and _ match literally", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});

describe("searchHref", () => {
  it("builds a search link, leaving out what isn't set", () => {
    expect(searchHref({})).toBe("/search");
    expect(searchHref({ q: "  " })).toBe("/search");
    expect(searchHref({ category: "abc" })).toBe("/search?category=abc");
    expect(searchHref({ category: "abc", q: "umrah hotel" })).toBe(
      "/search?category=abc&q=umrah+hotel",
    );
  });
});
