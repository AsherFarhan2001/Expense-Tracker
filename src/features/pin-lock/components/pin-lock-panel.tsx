import { isPinEnabled } from "../config";
import { LockDeviceButton } from "./lock-device-button";

/** Settings panel describing the PIN lock (enabled on the live site via APP_PIN_HASH). */
export function PinLockPanel() {
  const enabled = isPinEnabled();
  return (
    <section className="grid gap-4">
      <h2 className="border-b pb-2 text-sm font-medium text-muted-foreground">
        PIN lock
      </h2>
      {enabled ? (
        <div className="grid gap-3 text-sm">
          <p className="text-muted-foreground">
            This device stays unlocked for 30 days. Lock it now if someone else
            uses it.
          </p>
          <LockDeviceButton />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Off on this computer. The live site asks for your PIN on each new
          device once <code className="text-foreground">APP_PIN_HASH</code> is
          set.
        </p>
      )}
    </section>
  );
}
