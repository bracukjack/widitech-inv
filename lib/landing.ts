/**
 * Landing page content, editable per section by the admin.
 * Text may contain {template} — replaced with the number of active templates.
 */

export const LANDING_SECTIONS = ["hero", "stats", "features", "demo", "templates", "steps", "pricing", "faq", "cta"] as const;
export type LandingSectionId = (typeof LANDING_SECTIONS)[number];

export const SECTION_LABEL: Record<LandingSectionId, string> = {
  hero: "Hero (bagian atas)",
  stats: "Angka / statistik",
  features: "Fitur",
  demo: "Coba langsung (demo)",
  templates: "Galeri template",
  steps: "Cara kerja",
  pricing: "Harga",
  faq: "FAQ",
  cta: "Ajakan penutup",
};

export const FEATURE_ICONS = [
  "infinity",
  "layout-template",
  "file-down",
  "message-circle",
  "calculator",
  "wallet-cards",
  "languages",
  "smartphone",
  "cloud-check",
  "sparkles",
  "shield-check",
  "zap",
  "clock",
  "users",
  "heart",
  "star",
] as const;
export type FeatureIcon = (typeof FEATURE_ICONS)[number];

export interface LandingContent {
  order: LandingSectionId[];
  hero: {
    enabled: boolean;
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    bullets: string[];
    /** Shown as a moving strip under the hero ("cocok untuk …"). */
    audiences: string[];
  };
  stats: { enabled: boolean; items: { value: string; label: string }[] };
  features: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    items: { icon: FeatureIcon; title: string; text: string }[];
  };
  demo: { enabled: boolean; eyebrow: string; title: string; subtitle: string; buttonLabel: string };
  templates: { enabled: boolean; eyebrow: string; title: string; subtitle: string; buttonLabel: string };
  steps: { enabled: boolean; eyebrow: string; title: string; items: { title: string; text: string }[] };
  pricing: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    planName: string;
    badge: string;
    price: string;
    period: string;
    features: string[];
    buttonLabel: string;
    note: string;
  };
  faq: { enabled: boolean; eyebrow: string; title: string; items: { q: string; a: string }[] };
  cta: { enabled: boolean; title: string; subtitle: string; buttonLabel: string };
  footer: { text: string; contactEmail: string };
}

export const DEFAULT_LANDING: LandingContent = {
  order: [...LANDING_SECTIONS],
  hero: {
    enabled: true,
    badge: "100% gratis · Unlimited invoice",
    title: "Buat invoice profesional. Gratis, tanpa batas.",
    subtitle:
      "Isi klien dan item, pilih template, lalu kirim PDF ke klien lewat WhatsApp atau email. Tanpa biaya langganan, tanpa batas jumlah invoice, tanpa watermark.",
    primaryCta: "Buat invoice gratis",
    secondaryCta: "Lihat template",
    bullets: ["Tanpa kartu kredit", "Tanpa watermark", "Tanpa biaya tersembunyi"],
    audiences: ["Freelancer", "Desainer grafis", "Fotografer", "Developer", "Konsultan", "UMKM", "Agensi kreatif", "Penulis & editor", "Videografer", "Event organizer"],
  },
  stats: {
    enabled: true,
    items: [
      { value: "Rp 0", label: "Biaya selamanya" },
      { value: "∞", label: "Jumlah invoice" },
      { value: "{template}+", label: "Template siap pakai" },
      { value: "< 1 menit", label: "Membuat 1 invoice" },
    ],
  },
  features: {
    enabled: true,
    eyebrow: "Fitur",
    title: "Semua yang Anda butuhkan untuk menagih klien",
    subtitle: "Tidak ada fitur yang dikunci. Semua tersedia gratis untuk semua orang.",
    items: [
      { icon: "infinity", title: "Invoice tanpa batas", text: "Buat invoice sebanyak apa pun. Tidak ada kuota bulanan, tidak ada paket premium." },
      { icon: "layout-template", title: "Banyak template", text: "Pilih desain yang cocok dengan brand Anda — ganti kapan saja dengan satu klik." },
      { icon: "file-down", title: "PDF siap kirim", text: "Download PDF A4 yang rapi, tanpa watermark, langsung dari HP atau laptop." },
      { icon: "message-circle", title: "Kirim via WhatsApp", text: "Bagikan tagihan lengkap dengan nominal & rekening ke klien dalam sekali ketuk." },
      { icon: "calculator", title: "Hitung otomatis", text: "Diskon, PPN 11/12%, qty dan total dihitung otomatis. Tidak ada salah hitung." },
      { icon: "wallet-cards", title: "DP & termin", text: "Atur pembayaran bertahap (DP 50% / pelunasan) dan pantau sisa tagihan." },
      { icon: "languages", title: "Indonesia & English", text: "Invoice untuk klien lokal maupun luar negeri, dengan Rupiah, USD, EUR, SGD dan lainnya." },
      { icon: "smartphone", title: "Nyaman di HP", text: "Dirancang untuk layar kecil. Buat invoice di mana pun, kapan pun." },
      { icon: "cloud-check", title: "Tersimpan aman", text: "Data tersimpan di akun Anda, bisa dibuka dari perangkat mana saja." },
    ],
  },
  demo: {
    enabled: true,
    eyebrow: "Coba langsung",
    title: "Ketik, lihat invoice-nya jadi seketika",
    subtitle: "Isi nama klien, layanan dan harga — tanpa daftar. Seperti inilah rasanya membuat invoice di sini.",
    buttonLabel: "Simpan & kirim invoice ini",
  },
  templates: {
    enabled: true,
    eyebrow: "Template",
    title: "{template} desain invoice, semuanya gratis",
    subtitle: "Klik template untuk melihat detailnya. Ganti template kapan saja tanpa mengetik ulang.",
    buttonLabel: "Pakai template ini",
  },
  steps: {
    enabled: true,
    eyebrow: "Cara kerja",
    title: "Tiga langkah, invoice terkirim",
    items: [
      { title: "Daftar gratis", text: "Cukup nama, email dan password. Tanpa kartu kredit." },
      { title: "Isi klien & item", text: "Klien dan item yang pernah dipakai terisi otomatis." },
      { title: "Kirim & terima bayaran", text: "Download PDF atau kirim lewat WhatsApp, lalu tandai lunas." },
    ],
  },
  pricing: {
    enabled: true,
    eyebrow: "Harga",
    title: "Satu paket: gratis",
    subtitle: "Tidak ada paket berbayar. Semua fitur, untuk semua orang, selamanya.",
    planName: "Gratis",
    badge: "Selamanya",
    price: "Rp 0",
    period: "/ bulan",
    features: [
      "Invoice unlimited",
      "Klien unlimited",
      "Semua template",
      "Download PDF tanpa watermark",
      "Kirim via WhatsApp & email",
      "Pajak, diskon & termin pembayaran",
      "Logo & rekening bisnis sendiri",
    ],
    buttonLabel: "Mulai sekarang — gratis",
    note: "Tanpa kartu kredit. Tanpa masa percobaan.",
  },
  faq: {
    enabled: true,
    eyebrow: "FAQ",
    title: "Pertanyaan yang sering ditanyakan",
    items: [
      { q: "Apakah benar-benar gratis?", a: "Ya. Semua fitur bisa dipakai gratis. Tidak ada paket berbayar, masa percobaan, atau biaya tersembunyi." },
      { q: "Ada batas jumlah invoice?", a: "Tidak ada. Buat invoice sebanyak yang Anda butuhkan — unlimited." },
      { q: "Apakah PDF-nya ada watermark?", a: "Tidak. Invoice tampil bersih dengan nama, logo dan rekening bisnis Anda sendiri." },
      { q: "Bisa dipakai di HP?", a: "Bisa. Tampilan dirancang mobile-first, termasuk download PDF dan kirim lewat WhatsApp." },
      { q: "Bisa untuk klien luar negeri?", a: "Bisa. Pilih bahasa dokumen English dan mata uang seperti USD, EUR, SGD, MYR atau AUD." },
      { q: "Bagaimana dengan keamanan data?", a: "Setiap akun dilindungi password, dan invoice Anda hanya bisa dilihat oleh Anda sendiri." },
    ],
  },
  cta: {
    enabled: true,
    title: "Kirim invoice pertama Anda hari ini",
    subtitle: "Gratis, tanpa batas, dan siap dipakai dalam 1 menit.",
    buttonLabel: "Buat invoice gratis",
  },
  footer: { text: "Invoice gratis untuk freelancer dan UMKM Indonesia.", contactEmail: "" },
};

type Loose = Record<string, unknown>;

/** Fills anything missing (e.g. sections added in a later version) from the defaults. */
export function mergeLanding(raw: unknown): LandingContent {
  const r = (raw && typeof raw === "object" ? raw : {}) as Loose;
  const out = structuredClone(DEFAULT_LANDING) as unknown as Loose;
  for (const key of Object.keys(DEFAULT_LANDING) as (keyof LandingContent)[]) {
    if (key === "order") continue;
    const v = r[key];
    if (v && typeof v === "object" && !Array.isArray(v)) out[key] = { ...(out[key] as Loose), ...(v as Loose) };
  }
  const order = Array.isArray(r.order) ? (r.order as string[]).filter((s): s is LandingSectionId => (LANDING_SECTIONS as readonly string[]).includes(s)) : [];
  // Keep the saved order, append any section that's new since it was saved.
  out.order = [...new Set([...order, ...LANDING_SECTIONS])];
  return out as unknown as LandingContent;
}

export function fillTokens(text: string, templateCount: number): string {
  return text.replaceAll("{template}", String(templateCount));
}
