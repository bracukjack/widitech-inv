export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  // Colors
  headerBg: string;
  headerText: string;
  accentColor: string;
  bodyBg: string;
  bodyText: string;
  mutedText: string;
  tableBg: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  borderColor: string;
  badgeBg: string;
  // Typography
  fontFamily: string;
  headingWeight: number;
  // Layout
  headerStyle: "full" | "accent-bar" | "minimal" | "split";
}

export const THEME_IDS = [
  "minimal",
  "professional",
  "modern",
  "tech",
  "vintage",
  "corporate",
  "elegant",
  "luxury",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEMES: Record<ThemeId, ThemeConfig> = {
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Clean & simple",
    headerBg: "#ffffff",
    headerText: "#111827",
    accentColor: "#6B7280",
    bodyBg: "#ffffff",
    bodyText: "#111827",
    mutedText: "#6B7280",
    tableBg: "#ffffff",
    tableHeaderBg: "#F9FAFB",
    tableHeaderText: "#6B7280",
    borderColor: "#E5E7EB",
    badgeBg: "#F3F4F6",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 600,
    headerStyle: "minimal",
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "Teal accent header",
    headerBg: "#0D7377",
    headerText: "#ffffff",
    accentColor: "#0D7377",
    bodyBg: "#ffffff",
    bodyText: "#111827",
    mutedText: "#6B7280",
    tableBg: "#ffffff",
    tableHeaderBg: "rgba(13,115,119,0.08)",
    tableHeaderText: "#0D7377",
    borderColor: "#E5E7EB",
    badgeBg: "#F0FDFA",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 700,
    headerStyle: "full",
  },
  modern: {
    id: "modern",
    name: "Modern",
    description: "Bold blue gradient feel",
    headerBg: "#1E3A5F",
    headerText: "#ffffff",
    accentColor: "#2563EB",
    bodyBg: "#ffffff",
    bodyText: "#1E293B",
    mutedText: "#64748B",
    tableBg: "#ffffff",
    tableHeaderBg: "#EFF6FF",
    tableHeaderText: "#1E3A5F",
    borderColor: "#DBEAFE",
    badgeBg: "#EFF6FF",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 800,
    headerStyle: "full",
  },
  tech: {
    id: "tech",
    name: "Tech",
    description: "Dark header, clean body",
    headerBg: "#0F172A",
    headerText: "#F8FAFC",
    accentColor: "#0EA5E9",
    bodyBg: "#FFFFFF",
    bodyText: "#0F172A",
    mutedText: "#64748B",
    tableBg: "#FFFFFF",
    tableHeaderBg: "#F1F5F9",
    tableHeaderText: "#334155",
    borderColor: "#CBD5E1",
    badgeBg: "#F0F9FF",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    headingWeight: 700,
    headerStyle: "full",
  },
  vintage: {
    id: "vintage",
    name: "Vintage",
    description: "Warm & classic serif",
    headerBg: "#FEF3C7",
    headerText: "#78350F",
    accentColor: "#B45309",
    bodyBg: "#FFFBEB",
    bodyText: "#451A03",
    mutedText: "#92400E",
    tableBg: "#FFFBEB",
    tableHeaderBg: "#FEF3C7",
    tableHeaderText: "#78350F",
    borderColor: "#FDE68A",
    badgeBg: "#FEF3C7",
    fontFamily: "Georgia, 'Times New Roman', serif",
    headingWeight: 700,
    headerStyle: "minimal",
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    description: "Classic business style",
    headerBg: "#1F2937",
    headerText: "#F9FAFB",
    accentColor: "#374151",
    bodyBg: "#ffffff",
    bodyText: "#111827",
    mutedText: "#6B7280",
    tableBg: "#ffffff",
    tableHeaderBg: "#F3F4F6",
    tableHeaderText: "#374151",
    borderColor: "#D1D5DB",
    badgeBg: "#F3F4F6",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 700,
    headerStyle: "full",
  },
  elegant: {
    id: "elegant",
    name: "Elegant",
    description: "Refined serif luxury",
    headerBg: "#ffffff",
    headerText: "#1C1917",
    accentColor: "#B91C1C",
    bodyBg: "#ffffff",
    bodyText: "#1C1917",
    mutedText: "#78716C",
    tableBg: "#ffffff",
    tableHeaderBg: "#FAFAF9",
    tableHeaderText: "#44403C",
    borderColor: "#E7E5E4",
    badgeBg: "#FEF2F2",
    fontFamily: "'Playfair Display', Georgia, serif",
    headingWeight: 700,
    headerStyle: "accent-bar",
  },
  luxury: {
    id: "luxury",
    name: "Luxury",
    description: "Gold & deep navy",
    headerBg: "#1E1B4B",
    headerText: "#EDE9FE",
    accentColor: "#B8972E",
    bodyBg: "#FEFCF8",
    bodyText: "#1C1A2E",
    mutedText: "#6B5F7A",
    tableBg: "#FEFCF8",
    tableHeaderBg: "#F0EBD8",
    tableHeaderText: "#1E1B4B",
    borderColor: "#E8DFC8",
    badgeBg: "#F0EBD8",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    headingWeight: 600,
    headerStyle: "full",
  },
};

export function getTheme(id: string): ThemeConfig {
  return THEMES[id as ThemeId] || THEMES.professional;
}
