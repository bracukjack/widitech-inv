"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileWarning,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DisplayStatus, Invoice } from "@/types/invoice";
import InvoiceDocument, {
  DOC_HEIGHT,
  DOC_WIDTH,
} from "@/components/InvoiceDocument";
import { STATUS_LABEL } from "@/lib/invoice";
import type { TemplateConfig } from "@/lib/themes";
import { useActiveTemplates } from "@/lib/store";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<DisplayStatus, string> = {
  Draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  Sent: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Overdue: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const STATUS_DOT: Record<DisplayStatus, string> = {
  Draft: "bg-zinc-400",
  Sent: "bg-blue-500",
  Overdue: "bg-amber-500",
  Paid: "bg-emerald-500",
};

export function StatusBadge({
  status,
  className,
}: {
  status: DisplayStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLE[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <FileWarning
        className="size-10 text-muted-foreground"
        strokeWidth={1.5}
      />
      <h2 className="text-lg font-semibold">Invoice tidak ditemukan</h2>
      <p className="text-sm text-muted-foreground">
        Mungkin sudah dihapus, atau tersimpan di browser/perangkat lain.
      </p>
      <Button asChild className="mt-2">
        <Link href="/invoices">Kembali ke daftar invoice</Link>
      </Button>
    </div>
  );
}

/** Renders the A4 document scaled down to whatever width its container has. */
export function ScaledPreview({
  invoice,
  logo,
  template,
  className,
}: {
  invoice: Invoice;
  logo?: string;
  /** Overrides the invoice's own template (used by the admin template editor). */
  template?: TemplateConfig;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [height, setHeight] = useState(DOC_HEIGHT);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      setScale(outer.clientWidth / DOC_WIDTH);
      setHeight(inner.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5",
        className,
      )}
      style={{
        height: scale ? height * scale : undefined,
        aspectRatio: scale ? undefined : `${DOC_WIDTH} / ${DOC_HEIGHT}`,
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: DOC_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <InvoiceDocument invoice={invoice} logo={logo} template={template} />
      </div>
    </div>
  );
}

// --- template picker ---

export function TemplateThumb({ template: t }: { template: TemplateConfig }) {
  const c = t.colors;
  const line = (w: string, color = c.border, h = 3) => (
    <div style={{ width: w, height: h, background: color, borderRadius: 2 }} />
  );
  return (
    <div
      className="flex aspect-[3/4] w-full flex-col overflow-hidden rounded-md"
      style={{ background: c.pageBg }}
    >
      {t.layout === "band" && (
        <div
          className="flex items-center justify-between px-2 py-2.5"
          style={{ background: c.headerBg }}
        >
          {line("38%", c.headerText, 4)}
          {line("22%", c.headerText, 5)}
        </div>
      )}
      {t.layout === "split" && (
        <div className="flex h-7">
          <div className="flex flex-1 items-center px-2">
            {line("70%", c.text, 4)}
          </div>
          <div
            className="flex w-[42%] items-center justify-end rounded-bl-lg px-2"
            style={{ background: c.headerBg }}
          >
            {line("70%", c.headerText, 4)}
          </div>
        </div>
      )}
      {t.layout === "accent" && (
        <>
          <div style={{ height: 4, background: c.accent }} />
          <div className="flex items-center justify-between px-2 py-2">
            {line("34%", c.text, 4)}
            {line("26%", c.accent, 5)}
          </div>
        </>
      )}
      {t.layout === "centered" && (
        <div className="flex flex-col items-center gap-1 px-2 pt-2.5 pb-1">
          <div
            className="size-2.5 rounded-full"
            style={{ background: c.accent }}
          />
          {line("40%", c.text, 3)}
          <div className="mt-0.5 flex w-full items-center gap-1">
            {line("100%", c.accent, 1)}
            {line("30%", c.accent, 3)}
            {line("100%", c.accent, 1)}
          </div>
        </div>
      )}
      {t.layout === "minimal" && (
        <div
          className="mx-2 flex items-center justify-between border-b-2 py-2"
          style={{ borderColor: c.text }}
        >
          {line("34%", c.text, 4)}
          {line("24%", c.text, 5)}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1 px-2 pt-2">
        {line("30%", c.muted, 2)}
        {line("45%", c.text, 3)}
        <div
          className="mt-1.5 rounded-sm"
          style={{
            height: 5,
            background: t.table === "lines" ? "transparent" : c.tableHeaderBg,
            borderBottom:
              t.table === "lines" ? `1.5px solid ${c.text}` : undefined,
          }}
        />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex justify-between px-0.5 py-[3px]"
            style={{
              background:
                t.table === "striped" && i % 2 ? c.soft : "transparent",
            }}
          >
            {line("50%", c.border)}
            {line("18%", c.border)}
          </div>
        ))}
        <div className="mt-auto mb-2 flex justify-end">
          {t.totalStyle === "box" ? (
            <div
              className="h-2.5 w-[45%] rounded-sm"
              style={{ background: c.accent }}
            />
          ) : (
            <div
              className="w-[45%] border-t-2 pt-0.5"
              style={{ borderColor: c.accent }}
            >
              {line("100%", c.accent, 3)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TemplatePicker({
  value,
  onChange,
  layout = "scroll",
}: {
  value: string;
  onChange: (id: string) => void;
  layout?: "scroll" | "grid";
}) {
  const templates = useActiveTemplates();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({
    atStart: true,
    atEnd: false,
    thumb: 1,
    offset: 0,
  });

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || layout !== "scroll") return;

    // Bring the selected template into view (without scrolling the page vertically).
    const active = el.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (active)
      el.scrollLeft =
        active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2;

    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      setScroll({
        atStart: el.scrollLeft <= 2,
        atEnd: el.scrollLeft >= max - 2,
        thumb: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1,
        offset: el.scrollWidth ? el.scrollLeft / el.scrollWidth : 0,
      });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
    // Only centre the active template on mount, not on every selection.
  }, [layout]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const items = templates.map((t) => {
    const active = t.id === value;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => onChange(t.id)}
        title={t.description}
        aria-pressed={active}
        className={cn(
          "group relative shrink-0 snap-start rounded-xl border bg-card p-1.5 text-left transition-all",
          layout === "scroll" && "w-[92px]",
          active
            ? "border-primary ring-2 ring-primary/25"
            : "border-border hover:border-foreground/25",
        )}
      >
        <TemplateThumb template={t} />
        <span
          className={cn(
            "mt-1.5 block truncate px-0.5 text-xs font-medium",
            active ? "text-primary" : "text-foreground/80",
          )}
        >
          {t.name}
        </span>
        {active && (
          <span className="absolute top-0.5 right-0.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="size-3" strokeWidth={3} />
          </span>
        )}
      </button>
    );
  });

  if (layout === "grid")
    return (
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">{items}</div>
    );

  const fade = 28;
  const mask = `linear-gradient(to right, ${scroll.atStart ? "#000" : "transparent"} 0, #000 ${fade}px, #000 calc(100% - ${fade}px), ${scroll.atEnd ? "#000" : "transparent"} 100%)`;
  const scrollable = scroll.thumb < 0.999;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="scrollbar-hide -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pt-0.5 pb-1"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {items}
      </div>

      {scrollable && (
        <>
          {!scroll.atStart && (
            <ScrollArrow side="left" onClick={() => scrollBy(-1)} />
          )}
          {!scroll.atEnd && (
            <ScrollArrow side="right" onClick={() => scrollBy(1)} />
          )}
          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 rounded-full bg-primary/70 transition-[left] duration-75"
                style={{
                  width: `${scroll.thumb * 100}%`,
                  left: `${scroll.offset * 100}%`,
                }}
              />
            </div>
            <span className="text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">
              {templates.length} template{scroll.atEnd ? "" : " · geser →"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function ScrollArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        side === "left" ? "Template sebelumnya" : "Template berikutnya"
      }
      className={cn(
        "absolute top-[42%] z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-md transition hover:bg-muted sm:grid",
        side === "left" ? "-left-2" : "-right-2",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
