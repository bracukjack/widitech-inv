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
  /** Inactive templates still render existing invoices but are hidden from pickers. */
  isActive: boolean;
  sortOrder: number;
}

type BuiltinTemplate = Omit<TemplateConfig, "isActive" | "sortOrder">;

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
];

export const BUILTIN_TEMPLATES: TemplateConfig[] = BUILTINS.map((t, i) => ({ ...t, isActive: true, sortOrder: i }));

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
