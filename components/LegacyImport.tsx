"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HardDriveUpload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markLegacyImported, readLegacyData } from "@/lib/legacy";
import { useInvoiceStore } from "@/lib/store";

/**
 * Offers to move invoices saved by the old browser-only version of the app
 * into the signed-in account. Renders nothing when there is nothing to move.
 * Mount only on the client (after the store has loaded).
 */
export default function LegacyImportBanner() {
  const [legacy, setLegacy] = useState(() => readLegacyData());
  const [busy, setBusy] = useState(false);
  const importData = useInvoiceStore((s) => s.importData);
  const hasSettings = useInvoiceStore((s) => Boolean(s.settings.profile.bankAccount || s.settings.profile.logo));

  if (!legacy) return null;

  const dismiss = () => {
    markLegacyImported();
    setLegacy(null);
  };

  const run = async () => {
    setBusy(true);
    try {
      // Don't let old browser settings overwrite a profile the user already filled in on the server.
      const { invoices } = await importData({ invoices: legacy.invoices, settings: hasSettings ? undefined : legacy.settings ?? undefined });
      toast.success(`${invoices} invoice dipindahkan ke akun Anda`);
      dismiss();
    } catch (e) {
      toast.error(`Import gagal: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 sm:flex-row sm:items-center dark:border-amber-500/30 dark:bg-amber-950/40">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white">
        <HardDriveUpload className="size-5" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Ada data lama di browser ini</p>
        <p className="text-muted-foreground">
          {legacy.invoices.length} invoice{legacy.settings ? " dan profil" : ""} dari versi sebelumnya. Pindahkan ke akun agar tersimpan di server?
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={run} disabled={busy} size="sm">
          {busy && <Loader2 className="size-3.5 animate-spin" />} Pindahkan
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={dismiss} aria-label="Abaikan" disabled={busy}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
