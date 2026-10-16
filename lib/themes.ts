/**
 * Invoice templates. Each one combines a header layout, a table style and a
 * totals style with a palette and a typeface, so templates differ in
 * structure — not only in colour.
 */

export const HEADER_LAYOUTS = ["band", "minimal", "accent", "split", "centered"] as const;
export const TABLE_STYLES = ["filled", "lines", "striped"] as const;
export const TOTAL_STYLES = ["line", "box"] as const;
export type HeaderLayout = (typeof HEADER_LAYOUTS)[number];
export type TableStyle = (typeof TABLE_STYLES)[number];
export type TotalStyle = (typeof TOTAL_STYLES)[number];

export const FONT_STACKS = {
  inter: "var(--font-inter), 'Helvetica Neue', Arial, sans-serif",
  grotesk: "var(--font-space-grotesk), 'Helvetica Neue', Arial, sans-serif",
  playfair: "var(--font-playfair), Georgia, 'Times New Roman', serif",
  cormorant: "var(--font-cormorant), Georgia, serif",
  jetbrains: "var(--font-jetbrains), 'Courier New', monospace",
} as const;
export type FontKey = keyof typeof FONT_STACKS;
export const FONT_LABEL: Record<FontKey, string> = {
  inter: "Inter (sans)",
  grotesk: "Space Grotesk (sans)",
  playfair: "Playfair Display (serif)",
  cormorant: "Cormorant Garamond (serif)",
  jetbrains: "JetBrains Mono (mono)",
};

/** Decorative ornaments drawn on the page (inline SVG, so they also end up in the PDF). */
export const DECORATIONS = ["none", "waves", "dots", "geometric", "circles", "lines"] as const;
export type Decoration = (typeof DECORATIONS)[number];
export const DECORATION_LABEL: Record<Decoration, string> = {
  none: "Tanpa ornamen",
  waves: "Gelombang",
  dots: "Titik-titik",
  geometric: "Geometris",
  circles: "Lingkaran",
  lines: "Garis miring",
};

export const COLOR_KEYS = [
  "accent",
  "headerBg",
  "headerText",
  "pageBg",
  "text",
  "muted",
  "border",
  "soft",
  "tableHeaderBg",
  "tableHeaderText",
] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  layout: HeaderLayout;
  table: TableStyle;
  totalStyle: TotalStyle;
  colors: Record<ColorKey, string>;
  font: FontKey;
  headingWeight: number;
  decoration: Decoration;
  /** Inactive templates still render existing invoices but are hidden from pickers. */
  isActive: boolean;
  sortOrder: number;
}

type BuiltinTemplate = Omit<TemplateConfig, "isActive" | "sortOrder" | "decoration"> & { decoration?: Decoration };

/** Starting set — seeded into the database, and the fallback before templates load. */
const BUILTINS: BuiltinTemplate[] = [
  {
    id: "professional",
    name: "Profesional",
    description: "Header teal penuh",
    layout: "band",
    table: "filled",
    totalStyle: "line",
    colors: {
      accent: "#0D7377", headerBg: "#0D7377", headerText: "#FFFFFF", pageBg: "#FFFFFF", text: "#111827",
      muted: "#6B7280", border: "#E5E7EB", soft: "#F0FDFA", tableHeaderBg: "#E6F4F4", tableHeaderText: "#0D7377",
    },
    font: "inter",
    headingWeight: 700,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Bersih & sederhana",
    layout: "minimal",
    table: "lines",
    totalStyle: "line",
    colors: {
      accent: "#111827", headerBg: "#FFFFFF", headerText: "#111827", pageBg: "#FFFFFF", text: "#111827",
      muted: "#6B7280", border: "#E5E7EB", soft: "#F9FAFB", tableHeaderBg: "#FFFFFF", tableHeaderText: "#6B7280",
    },
    font: "inter",
    headingWeight: 600,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Blok biru terbelah",
    layout: "split",
    table: "filled",
    totalStyle: "box",
    colors: {
      accent: "#2563EB", headerBg: "#1E3A8A", headerText: "#FFFFFF", pageBg: "#FFFFFF", text: "#1E293B",
      muted: "#64748B", border: "#DBEAFE", soft: "#EFF6FF", tableHeaderBg: "#EFF6FF", tableHeaderText: "#1E3A8A",
    },
    font: "grotesk",
    headingWeight: 700,
  },
  {
    id: "fresh",
    name: "Fresh",
    description: "Hijau segar, baris belang",
    layout: "accent",
    table: "striped",
    totalStyle: "box",
    colors: {
      accent: "#16A34A", headerBg: "#FFFFFF", headerText: "#14532D", pageBg: "#FFFFFF", text: "#14532D",
      muted: "#4B6355", border: "#DCFCE7", soft: "#F0FDF4", tableHeaderBg: "#16A34A", tableHeaderText: "#FFFFFF",
    },
    font: "inter",
    headingWeight: 700,
  },
  {
    id: "elegant",
    name: "Elegan",
    description: "Serif klasik, rata tengah",
    layout: "centered",
    table: "lines",
    totalStyle: "line",
    colors: {
      accent: "#B91C1C", headerBg: "#FFFFFF", headerText: "#1C1917", pageBg: "#FFFFFF", text: "#1C1917",
      muted: "#78716C", border: "#E7E5E4", soft: "#FEF2F2", tableHeaderBg: "#FFFFFF", tableHeaderText: "#44403C",
    },
    font: "playfair",
    headingWeight: 700,
  },
  {
    id: "tech",
    name: "Tech",
    description: "Gelap, huruf monospace",
    layout: "band",
    table: "striped",
    totalStyle: "line",
    colors: {
      accent: "#0EA5E9", headerBg: "#0F172A", headerText: "#F8FAFC", pageBg: "#FFFFFF", text: "#0F172A",
      muted: "#64748B", border: "#E2E8F0", soft: "#F1F5F9", tableHeaderBg: "#0F172A", tableHeaderText: "#F8FAFC",
    },
    font: "jetbrains",
    headingWeight: 700,
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Oranye hangat, berani",
    layout: "split",
    table: "lines",
    totalStyle: "box",
    colors: {
      accent: "#EA580C", headerBg: "#EA580C", headerText: "#FFFFFF", pageBg: "#FFFFFF", text: "#1F2937",
      muted: "#6B7280", border: "#FED7AA", soft: "#FFF7ED", tableHeaderBg: "#FFFFFF", tableHeaderText: "#9A3412",
    },
    font: "grotesk",
    headingWeight: 700,
  },
  {
    id: "corporate",
    name: "Korporat",
    description: "Abu gelap, formal",
    layout: "band",
    table: "filled",
    totalStyle: "box",
    colors: {
      accent: "#374151", headerBg: "#1F2937", headerText: "#F9FAFB", pageBg: "#FFFFFF", text: "#111827",
      muted: "#6B7280", border: "#D1D5DB", soft: "#F3F4F6", tableHeaderBg: "#F3F4F6", tableHeaderText: "#374151",
    },
    font: "inter",
    headingWeight: 700,
  },
  {
    id: "rose",
    name: "Rose",
    description: "Merah muda lembut",
    layout: "centered",
    table: "striped",
    totalStyle: "box",
    colors: {
      accent: "#DB2777", headerBg: "#FFFFFF", headerText: "#500724", pageBg: "#FFFFFF", text: "#3F1D2B",
      muted: "#8B6574", border: "#FCE7F3", soft: "#FDF2F8", tableHeaderBg: "#DB2777", tableHeaderText: "#FFFFFF",
    },
    font: "inter",
    headingWeight: 700,
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Biru laut, garis aksen",
    layout: "accent",
    table: "filled",
    totalStyle: "line",
    colors: {
      accent: "#0891B2", headerBg: "#FFFFFF", headerText: "#164E63", pageBg: "#FFFFFF", text: "#164E63",
      muted: "#5B7A86", border: "#CFFAFE", soft: "#ECFEFF", tableHeaderBg: "#ECFEFF", tableHeaderText: "#0E7490",
    },
    font: "inter",
    headingWeight: 700,
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Navy & emas",
    layout: "band",
    table: "lines",
    totalStyle: "box",
    colors: {
      accent: "#B8972E", headerBg: "#1E1B4B", headerText: "#F5F0DC", pageBg: "#FEFCF8", text: "#1C1A2E",
      muted: "#6B5F7A", border: "#E8DFC8", soft: "#F5EFDD", tableHeaderBg: "#FEFCF8", tableHeaderText: "#1E1B4B",
    },
    font: "cormorant",
    headingWeight: 700,
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Krem hangat, serif",
    layout: "minimal",
    table: "filled",
    totalStyle: "line",
    colors: {
      accent: "#B45309", headerBg: "#FFFBEB", headerText: "#78350F", pageBg: "#FFFBEB", text: "#451A03",
      muted: "#92400E", border: "#FDE68A", soft: "#FEF3C7", tableHeaderBg: "#FEF3C7", tableHeaderText: "#78350F",
    },
    font: "playfair",
    headingWeight: 700,
  },
  {
    id: "mono",
    name: "Monokrom",
    description: "Hitam putih, tegas",
    layout: "minimal",
    table: "striped",
    totalStyle: "box",
    colors: {
      accent: "#000000", headerBg: "#FFFFFF", headerText: "#000000", pageBg: "#FFFFFF", text: "#000000",
      muted: "#525252", border: "#D4D4D4", soft: "#F5F5F5", tableHeaderBg: "#000000", tableHeaderText: "#FFFFFF",
    },
    font: "grotesk",
    headingWeight: 800,
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Ungu lembut, header penuh",
    layout: "band",
    table: "striped",
    totalStyle: "line",
    colors: {
      accent: "#7C3AED", headerBg: "#7C3AED", headerText: "#FFFFFF", pageBg: "#FFFFFF", text: "#2E1065",
      muted: "#6B6080", border: "#EDE9FE", soft: "#F5F3FF", tableHeaderBg: "#EDE9FE", tableHeaderText: "#5B21B6",
    },
    font: "inter",
    headingWeight: 700,
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Ungu tua, lingkaran lembut",
    layout: "band",
    table: "filled",
    totalStyle: "box",
    decoration: "circles",
    colors: {
      accent: "#7C3AED", headerBg: "#4C1D95", headerText: "#FFFFFF", pageBg: "#FFFFFF", text: "#1E1B3A",
      muted: "#6B6584", border: "#EDE9FE", soft: "#F5F3FF", tableHeaderBg: "#F5F3FF", tableHeaderText: "#5B21B6",
    },
    font: "grotesk",
    headingWeight: 700,
  },
  {
    id: "coral",
    name: "Coral",
    description: "Merah koral, sudut geometris",
    layout: "accent",
    table: "lines",
    totalStyle: "box",
    decoration: "geometric",
    colors: {
      accent: "#F43F5E", headerBg: "#FFFFFF", headerText: "#3F0D17", pageBg: "#FFFFFF", text: "#2B1A1E",
      muted: "#7A6268", border: "#FFE4E6", soft: "#FFF1F2", tableHeaderBg: "#FFFFFF", tableHeaderText: "#9F1239",
    },
    font: "inter",
    headingWeight: 700,
  },
  {
    id: "forest",
    name: "Forest",
    description: "Hijau hutan, gelombang",
    layout: "split",
    table: "striped",
    totalStyle: "line",
    decoration: "waves",
    colors: {
      accent: "#15803D", headerBg: "#14532D", headerText: "#F0FDF4", pageBg: "#FFFFFF", text: "#14281D",
      muted: "#56695D", border: "#DCFCE7", soft: "#F0FDF4", tableHeaderBg: "#15803D", tableHeaderText: "#FFFFFF",
    },
    font: "inter",
    headingWeight: 700,
  },
  {
    id: "studio",
    name: "Studio",
    description: "Hitam & kuning, titik-titik",
    layout: "minimal",
    table: "filled",
    totalStyle: "box",
    decoration: "dots",
    colors: {
      accent: "#D97706", headerBg: "#FFFFFF", headerText: "#111111", pageBg: "#FFFFFF", text: "#111111",
      muted: "#5C5C5C", border: "#E7E5E4", soft: "#FFFBEB", tableHeaderBg: "#111111", tableHeaderText: "#FDE68A",
    },
    font: "grotesk",
    headingWeight: 800,
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Navy gelap & emas, berkelas",
    layout: "band",
    table: "striped",
    totalStyle: "box",
    decoration: "geometric",
    colors: { accent: "#CA8A04", headerBg: "#0B1120", headerText: "#FDE68A", pageBg: "#FFFFFF", text: "#0F172A", muted: "#64748B", border: "#E2E8F0", soft: "#FEFCE8", tableHeaderBg: "#0B1120", tableHeaderText: "#FDE68A" },
    font: "grotesk",
    headingWeight: 700,
  },
  {
    id: "sakura",
    name: "Sakura",
    description: "Pink lembut, serif anggun",
    layout: "centered",
    table: "lines",
    totalStyle: "line",
    decoration: "circles",
    colors: { accent: "#DB2777", headerBg: "#FFFFFF", headerText: "#500724", pageBg: "#FFFBFD", text: "#3B1426", muted: "#8A5B6E", border: "#FBCFE8", soft: "#FDF2F8", tableHeaderBg: "#FFFBFD", tableHeaderText: "#9D174D" },
    font: "playfair",
    headingWeight: 700,
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Bata hangat, nuansa artisan",
    layout: "split",
    table: "filled",
    totalStyle: "box",
    decoration: "waves",
    colors: { accent: "#C2410C", headerBg: "#7C2D12", headerText: "#FFF7ED", pageBg: "#FFFCF8", text: "#3B1D10", muted: "#8A6A5A", border: "#FED7AA", soft: "#FFF7ED", tableHeaderBg: "#FFEDD5", tableHeaderText: "#9A3412" },
    font: "cormorant",
    headingWeight: 700,
  },
  {
    id: "mint",
    name: "Mint",
    description: "Hijau mint, ringan & segar",
    layout: "accent",
    table: "filled",
    totalStyle: "line",
    decoration: "dots",
    colors: { accent: "#059669", headerBg: "#FFFFFF", headerText: "#064E3B", pageBg: "#FFFFFF", text: "#0F2E25", muted: "#557367", border: "#D1FAE5", soft: "#ECFDF5", tableHeaderBg: "#D1FAE5", tableHeaderText: "#047857" },
    font: "inter",
    headingWeight: 700,
  },
  {
    id: "slate",
    name: "Slate",
    description: "Abu kebiruan, rapi & netral",
    layout: "minimal",
    table: "lines",
    totalStyle: "box",
    decoration: "lines",
    colors: { accent: "#475569", headerBg: "#FFFFFF", headerText: "#0F172A", pageBg: "#FFFFFF", text: "#0F172A", muted: "#64748B", border: "#E2E8F0", soft: "#F1F5F9", tableHeaderBg: "#FFFFFF", tableHeaderText: "#475569" },
    font: "inter",
    headingWeight: 600,
  },
  {
    id: "royal",
    name: "Royal",
    description: "Biru kerajaan, serif klasik",
    layout: "band",
    table: "lines",
    totalStyle: "box",
    decoration: "circles",
    colors: { accent: "#1D4ED8", headerBg: "#1E3A8A", headerText: "#FFFFFF", pageBg: "#FFFFFF", text: "#172554", muted: "#5B6B8C", border: "#DBEAFE", soft: "#EFF6FF", tableHeaderBg: "#FFFFFF", tableHeaderText: "#1E3A8A" },
    font: "playfair",
    headingWeight: 700,
  },
  {
    id: "sunflower",
    name: "Sunflower",
    description: "Kuning cerah, playful",
    layout: "accent",
    table: "striped",
    totalStyle: "box",
    decoration: "dots",
    colors: { accent: "#CA8A04", headerBg: "#FFFFFF", headerText: "#422006", pageBg: "#FFFFFF", text: "#292524", muted: "#78716C", border: "#FEF08A", soft: "#FEFCE8", tableHeaderBg: "#CA8A04", tableHeaderText: "#FFFFFF" },
    font: "grotesk",
    headingWeight: 800,
  },
  {
    id: "berry",
    name: "Berry",
    description: "Magenta tua, berani",
    layout: "split",
    table: "striped",
    totalStyle: "line",
    decoration: "geometric",
    colors: { accent: "#9D174D", headerBg: "#831843", headerText: "#FFFFFF", pageBg: "#FFFFFF", text: "#2A0F1C", muted: "#7A5566", border: "#FCE7F3", soft: "#FDF2F8", tableHeaderBg: "#9D174D", tableHeaderText: "#FFFFFF" },
    font: "grotesk",
    headingWeight: 700,
  },
  {
    id: "nordic",
    name: "Nordic",
    description: "Tenang, latar abu salju",
    layout: "minimal",
    table: "filled",
    totalStyle: "line",
    decoration: "none",
    colors: { accent: "#0F766E", headerBg: "#F8FAFC", headerText: "#0F172A", pageBg: "#F8FAFC", text: "#1E293B", muted: "#64748B", border: "#E2E8F0", soft: "#F1F5F9", tableHeaderBg: "#E2E8F0", tableHeaderText: "#334155" },
    font: "inter",
    headingWeight: 600,
  },
  {
    id: "neon",
    name: "Neon",
    description: "Hitam pekat, hijau neon",
    layout: "band",
    table: "striped",
    totalStyle: "box",
    decoration: "lines",
    colors: { accent: "#16A34A", headerBg: "#18181B", headerText: "#4ADE80", pageBg: "#FFFFFF", text: "#18181B", muted: "#71717A", border: "#E4E4E7", soft: "#F4F4F5", tableHeaderBg: "#18181B", tableHeaderText: "#4ADE80" },
    font: "jetbrains",
    headingWeight: 700,
  },
  {
    id: "paper",
    name: "Paper",
    description: "Kertas krem, gaya surat",
    layout: "centered",
    table: "lines",
    totalStyle: "line",
    decoration: "none",
    colors: { accent: "#78350F", headerBg: "#FFFDF7", headerText: "#451A03", pageBg: "#FFFDF7", text: "#2B1A0E", muted: "#7C6A58", border: "#EADFCB", soft: "#FAF5EA", tableHeaderBg: "#FFFDF7", tableHeaderText: "#78350F" },
    font: "cormorant",
    headingWeight: 600,
  },
  {
    id: "skyline",
    name: "Skyline",
    description: "Biru langit, modern",
    layout: "split",
    table: "filled",
    totalStyle: "box",
    decoration: "waves",
    colors: { accent: "#0284C7", headerBg: "#0C4A6E", headerText: "#F0F9FF", pageBg: "#FFFFFF", text: "#0C2A3E", muted: "#5A7385", border: "#E0F2FE", soft: "#F0F9FF", tableHeaderBg: "#E0F2FE", tableHeaderText: "#075985" },
    font: "inter",
    headingWeight: 700,
  },
];

/** Ornaments for the original templates (newer ones declare their own). */
const BUILTIN_DECORATION: Record<string, Decoration> = {
  professional: "waves",
  modern: "geometric",
  fresh: "dots",
  tech: "lines",
  sunset: "circles",
  rose: "circles",
  ocean: "waves",
  luxury: "geometric",
  mono: "lines",
  lavender: "dots",
};

export const BUILTIN_TEMPLATES: TemplateConfig[] = BUILTINS.map((t, i) => ({
  ...t,
  decoration: t.decoration ?? BUILTIN_DECORATION[t.id] ?? "none",
  isActive: true,
  sortOrder: i,
}));

export const DEFAULT_TEMPLATE_ID = "professional";

export function fontStack(font: string): string {
  return FONT_STACKS[font as FontKey] ?? FONT_STACKS.inter;
}

// --- registry: filled with the templates from the database once the app loads ---

let registry: TemplateConfig[] = BUILTIN_TEMPLATES;
let byId = new Map(registry.map((t) => [t.id, t]));

export function setTemplateRegistry(templates: TemplateConfig[]): void {
  if (!templates.length) return;
  registry = [...templates].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  byId = new Map(registry.map((t) => [t.id, t]));
}

export function getTemplate(id: string | undefined): TemplateConfig {
  return (
    (id && byId.get(id)) ||
    byId.get(DEFAULT_TEMPLATE_ID) ||
    registry.find((t) => t.isActive) ||
    BUILTIN_TEMPLATES[0]
  );
}

// --- user branding applied on top of a template ---

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Mix a colour with white (amount 0..1). */
export function tint(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const mix = rgb.map((c) => Math.round(c + (255 - c) * amount));
  return `#${mix.map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Mix a colour with black (amount 0..1). */
export function shade(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const mix = rgb.map((c) => Math.round(c * (1 - amount)));
  return `#${mix.map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

const onColor = (hex: string) => (luminance(hex) > 0.45 ? "#111111" : "#FFFFFF");

export interface BrandingOverrides {
  color?: string;
  font?: string;
  decoration?: string;
}

/**
 * Re-colours a template with the user's brand colour (strong surfaces become the
 * brand colour, pale ones a tint of it), and swaps font/ornament if chosen.
 */
export function applyBranding(t: TemplateConfig, b?: BrandingOverrides | null): TemplateConfig {
  if (!b) return t;
  let out = t;
  const color = b.color && /^#[0-9a-f]{6}$/i.test(b.color) ? b.color.toUpperCase() : "";
  if (color) {
    const c = t.colors;
    const recolor = (bg: string, fg: string): [string, string] => {
      const l = luminance(bg);
      if (bg.toUpperCase() === c.pageBg.toUpperCase() || l > 0.92) return [bg, fg === c.accent ? shade(color, 0.15) : fg];
      if (l < 0.55) return [color, onColor(color)];
      return [tint(color, 0.88), shade(color, 0.25)];
    };
    const [headerBg, headerText] = recolor(c.headerBg, c.headerText);
    const [tableHeaderBg, tableHeaderText] = recolor(c.tableHeaderBg, c.tableHeaderText);
    out = {
      ...out,
      colors: {
        ...c,
        accent: color,
        headerBg,
        headerText,
        tableHeaderBg,
        tableHeaderText,
        soft: tint(color, 0.93),
        border: tint(color, 0.82),
      },
    };
  }
  if (b.font && b.font in FONT_STACKS) out = { ...out, font: b.font as FontKey };
  if (b.decoration && (DECORATIONS as readonly string[]).includes(b.decoration)) out = { ...out, decoration: b.decoration as Decoration };
  return out;
}
