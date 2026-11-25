import { appIconResponse } from "@/components/layout/app-icon";

// Android home-screen icon (manifest purpose "maskable"): Android crops it to its own shape.
export function GET() {
  return appIconResponse(512, "maskable");
}
