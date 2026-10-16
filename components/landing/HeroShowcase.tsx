"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { ScaledPreview } from "@/components/invoice-ui";
import { sampleInvoice } from "@/components/landing/sample";
import type { TemplateConfig } from "@/lib/themes";
import { cn } from "@/lib/utils";

/** Hero visual: a real invoice whose template visitors can switch with one tap. */
export default function HeroShowcase({ templates }: { templates: TemplateConfig[] }) {
  const choices = templates.slice(0, 6);
  const [id, setId] = useState(choices[0]?.id);
  const template = choices.find((t) => t.id === id) ?? choices[0];
  const invoice = useMemo(() => sampleInvoice("Paid"), []);

  if (!template) return null;

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="mb-5 flex flex-col items-center gap-1 lg:items-start">
        {/* hand-written hint pointing at the swatches */}
        <div className="flex items-end gap-1 pl-2 font-hand text-2xl leading-none text-primary">
          <span className="animate-wiggle inline-block origin-bottom-left">Klik buat ganti template!</span>
          <svg aria-hidden viewBox="0 0 60 40" className="mb-[-14px] h-8 w-12">
            <path d="M4 6 C 26 4, 44 12, 50 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M42 26 L 50 33 L 55 23" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-background/80 p-1.5 shadow-sm backdrop-blur">
          {choices.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setId(t.id)}
              aria-pressed={t.id === template.id}
              aria-label={`Template ${t.name}`}
              title={t.name}
              className={cn(
                "size-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
                t.id === template.id ? "scale-110 border-foreground shadow-md ring-2 ring-background" : "border-background"
              )}
              style={{ background: t.colors.accent }}
            />
          ))}
          <span className="px-2 font-display text-sm font-semibold">{template.name}</span>
        </div>
      </div>

      <div className="relative">
        <div className="rotate-[-1.5deg] rounded-[1.25rem] bg-card p-2 shadow-2xl ring-1 shadow-primary/15 ring-border transition-transform duration-500 hover:rotate-0">
          <div key={template.id} className="animate-pop">
            <ScaledPreview invoice={invoice} template={template} />
          </div>
        </div>

        {/* spinning "free" sticker */}
        <div className="absolute -top-14 -right-6 hidden size-24 sm:block lg:-right-16">
          <svg viewBox="0 0 120 120" className="animate-spin-slow absolute inset-0 size-full">
            <defs>
              <path id="sticker-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
            </defs>
            <circle cx="60" cy="60" r="58" className="fill-primary" />
            <text className="fill-primary-foreground font-display text-[11.5px] font-bold tracking-[0.2em]">
              <textPath href="#sticker-circle">GRATIS • UNLIMITED • TANPA BIAYA •</textPath>
            </text>
          </svg>
          <span className="absolute inset-0 grid place-items-center">
            <span className="font-display text-2xl leading-none font-bold text-primary-foreground">Rp0</span>
          </span>
        </div>

        <div className="animate-float absolute bottom-40 -left-4 hidden items-center gap-2 rounded-2xl border border-border bg-background/95 px-3.5 py-2.5 text-sm font-semibold shadow-xl backdrop-blur sm:flex lg:-left-10">
          <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
            <BadgeCheck className="size-4.5" />
          </span>
          Dibayar lunas!
        </div>
        <div className="animate-float-slow absolute -right-3 bottom-12 hidden items-center gap-2 rounded-2xl border border-border bg-background/95 px-3.5 py-2.5 text-sm font-semibold shadow-xl backdrop-blur [animation-delay:1.2s] sm:flex lg:-right-8">
          <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="size-4.5" />
          </span>
          Terkirim via WhatsApp
        </div>
      </div>
    </div>
  );
}
