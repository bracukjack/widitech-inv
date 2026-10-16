"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import Brand from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavLink {
  anchor: string;
  label: string;
}

/** Sticky landing header: turns solid on scroll, highlights the current section, mobile menu. */
export default function LandingHeader({
  brand,
  links,
  loggedIn,
  startHref,
}: {
  brand: { name: string; logo: string | null };
  links: NavLink[];
  loggedIn: boolean;
  startHref: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Scroll-spy: highlight the section nearest the top of the viewport.
    const sections = links.map((l) => document.getElementById(l.anchor)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, [links]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled || open ? "border-b border-border/70 bg-background/85 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="min-w-0" onClick={() => setOpen(false)}>
          <Brand name={brand.name} logo={brand.logo} />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.anchor}
              href={`#${l.anchor}`}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                current === l.anchor ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {!loggedIn && (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Masuk</Link>
            </Button>
          )}
          <Button asChild size="sm" className="hidden rounded-full px-4 shadow-md shadow-primary/25 sm:inline-flex">
            <Link href={startHref}>
              {loggedIn ? "Dashboard" : "Daftar gratis"} <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-xl hover:bg-muted md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-pop border-t border-border bg-background px-4 pt-3 pb-6 md:hidden">
          <nav className="flex flex-col">
            {links.map((l) => (
              <a key={l.anchor} href={`#${l.anchor}`} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-muted">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 grid gap-2">
            <Button asChild size="lg">
              <Link href={startHref}>{loggedIn ? "Buka dashboard" : "Daftar gratis"}</Link>
            </Button>
            {!loggedIn && (
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Masuk</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
