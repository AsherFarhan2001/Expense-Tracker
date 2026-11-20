import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lockDevice } from "../actions";

export function LockDeviceButton() {
  return (
    <form action={lockDevice}>
      <Button type="submit" variant="outline">
        <Lock data-icon="inline-start" />
        Lock this device
      </Button>
    </form>
  );
}
