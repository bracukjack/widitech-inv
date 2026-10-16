"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScaledPreview } from "@/components/invoice-ui";
import { sampleInvoice } from "@/components/landing/sample";
import type { TemplateConfig } from "@/lib/themes";

/** Real, scaled invoice previews for every template, with a detail viewer. */
export default function TemplateGallery({
  templates,
  buttonLabel,
  loggedIn,
}: {
  templates: TemplateConfig[];
  buttonLabel: string;
  loggedIn: boolean;
}) {
  const invoice = useMemo(() => sampleInvoice("Sent"), []);
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null ? templates[index] : null;

  const step = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i === null ? i : (i + dir + templates.length) % templates.length)),
    [templates.length]
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, step]);

  const hrefFor = (id: string) => {
    const target = `/invoice/new?template=${encodeURIComponent(id)}`;
    return loggedIn ? target : `/register?next=${encodeURIComponent(target)}`;
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {templates.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group rounded-2xl border border-border bg-background p-2 text-left shadow-xs transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="relative overflow-hidden rounded-lg">
              <ScaledPreview invoice={invoice} template={t} className="pointer-events-none shadow-none" />
              <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black shadow">
                  <Eye className="size-3.5" /> Lihat detail
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-1 pt-2.5 pb-1">
              <span className="size-3 shrink-0 rounded-full" style={{ background: t.colors.accent }} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.description}</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {open && index !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm" onClick={() => setIndex(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Template ${open.name}`}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex h-full w-full max-w-3xl flex-col bg-background sm:my-6 sm:h-[calc(100%-3rem)] sm:rounded-2xl sm:shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className="size-3.5 shrink-0 rounded-full" style={{ background: open.colors.accent }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{open.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {open.description} · {index + 1} dari {templates.length}
                </p>
              </div>
              <button type="button" onClick={() => setIndex(null)} aria-label="Tutup" className="grid size-9 place-items-center rounded-lg hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto bg-muted/60 p-4 sm:p-6">
              <ScaledPreview invoice={invoice} template={open} className="mx-auto max-w-2xl" />
            </div>

            <div className="pb-safe flex items-center gap-2 border-t border-border px-4 pt-3">
              <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label="Template sebelumnya">
                <ChevronLeft className="size-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => step(1)} aria-label="Template berikutnya">
                <ChevronRight className="size-5" />
              </Button>
              <Button asChild className="ml-auto">
                <Link href={hrefFor(open.id)}>
                  {buttonLabel} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
