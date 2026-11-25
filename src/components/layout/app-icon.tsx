import { ImageResponse } from "next/og";
import { BRAND, LOGO_BAND_PATH } from "./brand";

/**
 * How the logo is fitted to each icon slot:
 * - `rounded`: transparent corners, exactly like the header logo (browser tabs, desktop installs).
 * - `square`: edge-to-edge tile, because iPhone rounds the corners itself.
 * - `maskable`: edge-to-edge tile with the band shrunk into the central safe zone, because
 *   Android crops icons to a circle or squircle.
 */
export type AppIconShape = "rounded" | "square" | "maskable";

/** The logo as a 24×24 SVG for the given icon slot. */
export function appIconSvg(shape: AppIconShape): string {
  const cornerRadius = shape === "rounded" ? 6 : 0;
  // The band's outer corners must stay inside the 40%-radius safe circle on Android.
  const bandScale = shape === "maskable" ? 0.75 : 1;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">`,
    `<rect width="24" height="24" rx="${cornerRadius}" fill="${BRAND.maroon}"/>`,
    `<path d="${LOGO_BAND_PATH}" fill="${BRAND.white}" transform="translate(12 12) scale(${bandScale}) translate(-12 -12)"/>`,
    `</svg>`,
  ].join("");
}

/** A PNG of the logo, `size` pixels square. */
export function appIconResponse(size: number, shape: AppIconShape) {
  const src = `data:image/svg+xml;base64,${Buffer.from(appIconSvg(shape)).toString("base64")}`;
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by ImageResponse, not a page */}
      <img src={src} width={size} height={size} alt="" />
    </div>,
    { width: size, height: size },
  );
}
