/**
 * Brand values used outside CSS (app icons, manifest, browser theme colour).
 * Keep in sync with the light/dark tokens in `src/app/globals.css`.
 */
export const BRAND = {
  /** `--primary` in light mode: Qatar maroon. */
  maroon: "#8a1538",
  white: "#ffffff",
  /** `--background` in light and dark mode. */
  lightBackground: "#f3f4f6",
  darkBackground: "#111419",
} as const;

/** The logo's serrated white band, drawn on a 24×24 tile. */
export const LOGO_BAND_PATH = "M4 4h4l2 2-2 2 2 2-2 2 2 2-2 2 2 2-2 2H4z";
