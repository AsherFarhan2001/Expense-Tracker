import { appIconResponse } from "@/components/layout/app-icon";

// App icons for browsers, desktop installs and the manifest: /icon/192 and /icon/512.
const SIZES = [192, 512] as const;

export const contentType = "image/png";

export function generateImageMetadata() {
  return SIZES.map((px) => ({
    id: String(px),
    size: { width: px, height: px },
    contentType,
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const px = Number(await id);
  return appIconResponse(
    SIZES.find((size) => size === px) ?? SIZES[0],
    "rounded",
  );
}
