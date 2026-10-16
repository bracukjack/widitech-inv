import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import Brand from "@/components/Brand";
import { Button } from "@/components/ui/button";
import HeroShowcase from "@/components/landing/HeroShowcase";
import LandingHeader from "@/components/landing/LandingHeader";
import LiveDemo from "@/components/landing/LiveDemo";
import Reveal from "@/components/landing/Reveal";
import TemplateGallery from "@/components/landing/TemplateGallery";
import { FEATURE_ICON } from "@/components/landing/icons";
import { getCurrentUser } from "@/lib/auth";
import { getAllTemplates } from "@/lib/data";
import { getSite, siteOrigin } from "@/lib/site";
import { siteAssetUrl } from "@/lib/site-config";
import { fillTokens, type LandingContent, type LandingSectionId } from "@/lib/landing";
import { BUILTIN_TEMPLATES, type TemplateConfig } from "@/lib/themes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const NAV_LINKS: { id: LandingSectionId; anchor: string; label: string }[] = [
  { id: "features", anchor: "fitur", label: "Fitur" },
  { id: "demo", anchor: "coba", label: "Coba" },
  { id: "templates", anchor: "template", label: "Template" },
  { id: "pricing", anchor: "harga", label: "Harga" },
  { id: "faq", anchor: "faq", label: "FAQ" },
];

/** Slight alternating tilt for the "sticker" stat cards. */
const TILT = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const [{ preview }, user] = await Promise.all([searchParams, getCurrentUser().catch(() => null)]);
  // Signed-in users go straight to their invoices (admins can still preview with ?preview=1).
  if (user && !preview) redirect("/invoices");

  const { settings: s, assets, landing: c } = await getSite();
  const origin = await siteOrigin(s);
  const active = await getAllTemplates()
    .then((list) => list.filter((t) => t.isActive))
    .catch(() => BUILTIN_TEMPLATES);
  const templates: TemplateConfig[] = active.length ? active : BUILTIN_TEMPLATES;
  const logo = siteAssetUrl("logo", assets);
  const t = (text: string) => fillTokens(text, templates.length);
  const startHref = user ? "/invoices" : "/register";
  const visible = c.order.filter((id) => c[id].enabled);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: s.siteName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: s.metaDescription,
        url: origin,
        offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
      },
      ...(c.faq.enabled && c.faq.items.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: c.faq.items.map((f) => ({
                "@type": "Question",
                name: t(f.q),
                acceptedAnswer: { "@type": "Answer", text: t(f.a) },
              })),
            },
          ]
        : []),
    ],
  };

  const sections: Record<LandingSectionId, React.ReactNode> = {
    hero: <Hero c={c} t={t} startHref={startHref} loggedIn={!!user} templates={templates} />,

    stats: (
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {c.stats.items.map((x, i) => (
            <Reveal key={i} delay={i * 80}>
              <div
                className={cn(
                  "rounded-3xl border border-border bg-card p-6 text-center shadow-sm transition-transform duration-300 hover:scale-105 hover:rotate-0",
                  TILT[i % TILT.length]
                )}
              >
                <p className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">{t(x.value)}</p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{t(x.label)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    ),

    features: (
      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <SectionHeading eyebrow={c.features.eyebrow} title={t(c.features.title)} subtitle={t(c.features.subtitle)} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.items.map((f, i) => {
            const Icon = FEATURE_ICON[f.icon] ?? FEATURE_ICON.sparkles;
            const featured = i === 0;
            // Bento: the first card is wide; the last one stretches to close the final row.
            const rest = (c.features.items.length + 1) % 3;
            const isLast = i === c.features.items.length - 1 && i > 0;
            const lastSpan = isLast ? (rest === 1 ? "lg:col-span-3" : rest === 2 ? "lg:col-span-2" : "") : "";
            return (
              <Reveal key={i} delay={(i % 3) * 90} className={cn(featured && "sm:col-span-2", lastSpan)}>
                <div
                  className={cn(
                    "group relative h-full overflow-hidden rounded-[1.75rem] border p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl",
                    featured
                      ? "border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : i % 2 === 0
                        ? "border-primary/15 bg-primary/[0.04]"
                        : "border-border bg-card"
                  )}
                >
                  {featured && <div aria-hidden className="absolute -right-10 -bottom-16 size-56 rounded-full bg-white/15 blur-2xl" />}
                  <span
                    className={cn(
                      "relative grid size-13 place-items-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
                      featured ? "bg-white/20 text-current backdrop-blur" : "bg-background text-primary ring-1 ring-border"
                    )}
                  >
                    <Icon className="size-6" />
                  </span>
                  <h3 className={cn("relative mt-5 font-semibold", featured ? "text-2xl sm:text-3xl" : "text-xl")}>{t(f.title)}</h3>
                  <p className={cn("relative mt-2 leading-relaxed", featured ? "max-w-md text-base opacity-85" : "text-sm text-muted-foreground")}>
                    {t(f.text)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    ),

    demo: (
      <section id="coba" className="relative scroll-mt-24 overflow-clip py-20">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.06] to-transparent" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow={c.demo.eyebrow} title={t(c.demo.title)} subtitle={t(c.demo.subtitle)} />
          <Reveal className="mt-12">
            <LiveDemo templates={templates} buttonLabel={user ? "Buka dashboard" : c.demo.buttonLabel} startHref={startHref} />
          </Reveal>
        </div>
      </section>
    ),

    templates: (
      <section id="template" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow={c.templates.eyebrow} title={t(c.templates.title)} subtitle={t(c.templates.subtitle)} />
          <Reveal className="mt-12">
            <TemplateGallery templates={templates} buttonLabel={c.templates.buttonLabel} loggedIn={!!user} />
          </Reveal>
        </div>
      </section>
    ),

    steps: (
      <section className="bg-card/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow={c.steps.eyebrow} title={t(c.steps.title)} />
          <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div aria-hidden className="absolute top-8 right-[16%] left-[16%] hidden border-t-2 border-dashed border-primary/30 md:block" />
            {c.steps.items.map((step, i) => (
              <Reveal as="li" key={i} delay={i * 120} className="relative text-center">
                <span className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-primary font-display text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:rotate-6">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-xl font-semibold">{t(step.title)}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">{t(step.text)}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    ),

    pricing: (
      <section id="harga" className="relative scroll-mt-24 overflow-clip py-20">
        <div aria-hidden className="animate-blob absolute top-20 left-1/2 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow={c.pricing.eyebrow} title={t(c.pricing.title)} subtitle={t(c.pricing.subtitle)} />
          <Reveal className="mx-auto mt-12 max-w-md">
            <div className="rounded-[2rem] border-2 border-primary bg-background p-8 shadow-2xl shadow-primary/15">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl font-semibold">{c.pricing.planName}</p>
                {c.pricing.badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="size-3" /> {c.pricing.badge}
                  </span>
                )}
              </div>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-6xl font-bold tracking-tight text-primary">{c.pricing.price}</span>
                <span className="text-muted-foreground">{c.pricing.period}</span>
              </p>
              <ul className="mt-7 space-y-3 text-sm">
                {c.pricing.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {t(f)}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8 w-full rounded-full shadow-lg shadow-primary/25">
                <Link href={startHref}>
                  {user ? "Buka dashboard" : c.pricing.buttonLabel} <ArrowRight className="size-4" />
                </Link>
              </Button>
              {c.pricing.note && <p className="mt-3 text-center text-xs text-muted-foreground">{c.pricing.note}</p>}
            </div>
          </Reveal>
        </div>
      </section>
    ),

    faq: (
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6">
        <SectionHeading eyebrow={c.faq.eyebrow} title={t(c.faq.title)} />
        <div className="mt-10 space-y-3">
          {c.faq.items.map((f, i) => (
            <Reveal key={i} delay={i * 50}>
              <details className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-xs transition-colors open:border-primary/30 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {t(f.q)}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-lg leading-none text-muted-foreground transition-all group-open:rotate-45 group-open:bg-primary group-open:text-primary-foreground">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{t(f.a)}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>
    ),

    cta: (
      <section className="px-4 py-20 sm:px-6">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/25 sm:px-12">
          <div aria-hidden className="animate-blob absolute -top-24 -left-16 size-72 rounded-full bg-white/15 blur-2xl" />
          <div aria-hidden className="animate-blob absolute -right-20 -bottom-28 size-80 rounded-full bg-white/10 blur-2xl [animation-delay:-5s]" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px]"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-[-0.03em] text-balance sm:text-5xl">{t(c.cta.title)}</h2>
            {c.cta.subtitle && <p className="mx-auto mt-4 max-w-xl text-lg opacity-85">{t(c.cta.subtitle)}</p>}
            <Button asChild size="lg" variant="secondary" className="mt-9 rounded-full px-7 shadow-xl transition-transform hover:scale-105">
              <Link href={startHref}>
                {user ? "Buka dashboard" : c.cta.buttonLabel} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>
    ),
  };

  return (
    // overflow-x-clip (not hidden) so the sticky header keeps sticking to the viewport.
    <div className="min-h-dvh overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <LandingHeader
        brand={{ name: s.siteName, logo }}
        links={NAV_LINKS.filter((n) => visible.includes(n.id)).map(({ anchor, label }) => ({ anchor, label }))}
        loggedIn={!!user}
        startHref={startHref}
      />

      {preview && user?.role === "admin" && (
        <div className="border-b border-border bg-muted px-4 py-2 text-center text-xs text-muted-foreground">
          Mode preview admin —{" "}
          <Link href="/admin/landing" className="font-medium text-foreground underline">
            edit landing page
          </Link>
        </div>
      )}

      <main>
        {visible.map((id) => (
          <div key={id}>{sections[id]}</div>
        ))}
      </main>

      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-start sm:px-6">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Brand name={s.siteName} logo={logo} />
            {c.footer.text && <p className="max-w-xs text-center sm:text-left">{t(c.footer.text)}</p>}
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:items-end">
            <div className="flex gap-4">
              <Link href="/login" className="hover:text-foreground">
                Masuk
              </Link>
              <Link href="/register" className="hover:text-foreground">
                Daftar gratis
              </Link>
            </div>
            {c.footer.contactEmail && (
              <a href={`mailto:${c.footer.contactEmail}`} className="hover:text-foreground">
                {c.footer.contactEmail}
              </a>
            )}
            <p>
              © {new Date().getFullYear()} {s.siteName}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Hero({
  c,
  t,
  startHref,
  loggedIn,
  templates,
}: {
  c: LandingContent;
  t: (s: string) => string;
  startHref: string;
  loggedIn: boolean;
  templates: TemplateConfig[];
}) {
  const h = c.hero;
  // "Part one. Part two." → the second sentence is highlighted in the brand colour.
  const title = t(h.title);
  const cut = title.indexOf(". ");
  const [lead, highlight] = cut > 0 ? [title.slice(0, cut + 1), title.slice(cut + 2)] : [title, ""];

  return (
    <section className="relative -mt-16 overflow-clip pt-16">
      {/* soft brand-coloured background */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="animate-blob absolute -top-32 -left-24 size-[480px] rounded-full bg-primary/15 blur-3xl" />
        <div className="animate-blob absolute top-10 right-[-120px] size-[420px] rounded-full bg-primary/10 blur-3xl [animation-delay:-4s]" />
        <div className="absolute inset-0 [background-image:radial-gradient(color-mix(in_oklab,var(--foreground)_10%,transparent)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] [background-size:24px_24px]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24 lg:pb-20">
        <div className="text-center lg:text-left">
          {h.badge && (
            <span className="animate-pop inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 py-1 pr-3.5 pl-1 text-xs font-semibold shadow-sm backdrop-blur">
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">BARU</span>
              {t(h.badge)}
            </span>
          )}
          <h1 className="mt-6 text-[2.6rem] leading-[1.04] font-bold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.2rem]">
            {lead}{" "}
            {highlight && (
              <span className="relative inline-block text-primary">
                {highlight}
                {/* hand-drawn underline */}
                <svg aria-hidden viewBox="0 0 300 20" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full opacity-40 sm:-bottom-3 sm:h-4">
                  <path
                    d="M3 14 C 60 4, 120 4, 170 10 S 260 17, 297 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                </svg>
              </span>
            )}
          </h1>
          {h.subtitle && (
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg lg:mx-0">{t(h.subtitle)}</p>
          )}
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg" className="w-full rounded-full px-7 shadow-xl shadow-primary/25 transition-transform hover:scale-[1.03] sm:w-auto">
              <Link href={startHref}>
                {loggedIn ? "Buka dashboard" : h.primaryCta} <ArrowRight className="size-4" />
              </Link>
            </Button>
            {h.secondaryCta && c.templates.enabled && (
              <Button asChild size="lg" variant="outline" className="w-full rounded-full bg-background/70 px-7 backdrop-blur sm:w-auto">
                <a href="#template">{h.secondaryCta}</a>
              </Button>
            )}
          </div>
          {h.bullets.length > 0 && (
            <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground lg:justify-start">
              {h.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {t(b)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <HeroShowcase templates={templates} />
      </div>

      {h.audiences.length > 0 && (
        <div className="border-y border-border/70 bg-background/60 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 sm:px-6">
            <span className="shrink-0 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Cocok untuk</span>
            <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <div className="animate-marquee flex w-max gap-2.5 hover:[animation-play-state:paused]">
                {[...h.audiences, ...h.audiences].map((a, i) => (
                  <span key={i} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium whitespace-nowrap">
                    {t(a)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">{eyebrow}</span>
      )}
      <h2 className="mt-4 text-[2rem] leading-[1.1] font-bold tracking-[-0.03em] text-balance sm:text-[2.75rem]">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-pretty text-muted-foreground">{subtitle}</p>}
    </Reveal>
  );
}
