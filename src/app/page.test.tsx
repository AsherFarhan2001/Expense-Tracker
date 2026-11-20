import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import HomePage from "./page";

test("renders the app heading", () => {
  render(<HomePage />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Expense Tracker" }),
  ).toBeInTheDocument();
});
