import type { MetadataRoute } from "next";
import { BRAND } from "@/components/layout/brand";

/** Makes the site installable: home-screen icon, opens full-screen without browser UI. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Expense Tracker",
    short_name: "Expenses",
    description: "Monthly expenses in QAR and PKR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Android's launch screen: the logo's maroon behind the icon.
    background_color: BRAND.maroon,
    // The page's own theme-color tags (light/dark) take over once it loads.
    theme_color: BRAND.lightBackground,
    lang: "en",
    dir: "ltr",
    categories: ["finance"],
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/maskable-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
