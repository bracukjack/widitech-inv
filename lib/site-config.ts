/** Site-wide settings editable by the admin. Shared by server and client code. */

export const SITE_ASSET_KEYS = ["logo", "favicon", "og"] as const;
export type SiteAssetKey = (typeof SITE_ASSET_KEYS)[number];

export interface SiteSettings {
  siteName: string;
  tagline: string;
  /** Absolute origin used for canonical URLs and social previews, e.g. https://invoice.example.com */
  siteUrl: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  allowIndexing: boolean;
  primaryColor: string;
}

export const DEFAULT_SITE: SiteSettings = {
  siteName: "Widitech Invoice",
  tagline: "Invoice gratis & unlimited",
  siteUrl: "",
  metaTitle: "Buat Invoice Gratis & Unlimited — Tanpa Biaya",
  metaDescription:
    "Buat invoice profesional dalam hitungan detik. 100% gratis, tanpa batas jumlah invoice, banyak template, download PDF dan kirim lewat WhatsApp.",
  keywords: "invoice gratis, buat invoice online, aplikasi invoice, template invoice, invoice pdf, faktur gratis, invoice freelancer",
  allowIndexing: true,
  primaryColor: "#0D7377",
};

/** Info about uploaded images: the version (update time) is used to bust caches. */
export type SiteAssetVersions = Partial<Record<SiteAssetKey, number>>;

export function siteAssetUrl(key: SiteAssetKey, versions: SiteAssetVersions): string | null {
  const v = versions[key];
  return v ? `/site-asset/${key}?v=${v}` : null;
}

/** Readable text colour (white or near-black) for a hex background. */
export function contrastText(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#0a0a0a" : "#ffffff";
}

/** Mixes a hex colour with white (amount 0..1) — used for a lighter primary in dark mode. */
export function lighten(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = [mix((n >> 16) & 255), mix((n >> 8) & 255), mix(n & 255)];
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
