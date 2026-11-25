import { appIconResponse } from "@/components/layout/app-icon";

// iPhone/iPad home-screen icon. iOS rounds the corners, so the tile goes edge to edge.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIconResponse(size.width, "square");
}
