import { describe, expect, it } from "vitest";
import { calendarMonthFor } from "./calendar";

const tracking = { min: "2026-12", max: "2027-03" };

describe("calendarMonthFor", () => {
  it("shows today's month before tracking starts, so today stays highlighted", () => {
    expect(
      calendarMonthFor("2026-12", "2026-11-21", {
        min: "2026-12",
        max: "2026-12",
      }),
    ).toBe("2026-11");
  });

  it("shows the month being viewed once tracking has started", () => {
    expect(calendarMonthFor("2027-03", "2027-03-09", tracking)).toBe("2027-03");
    expect(calendarMonthFor("2027-01", "2027-03-09", tracking)).toBe("2027-01");
  });
});
