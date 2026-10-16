import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Caveat,
  Cormorant_Garamond,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { getSite, siteOrigin } from "@/lib/site";
import { contrastText, DEFAULT_SITE, lighten, siteAssetUrl } from "@/lib/site-config";

// UI typefaces: Plus Jakarta Sans for text, Bricolage Grotesque for headings, Caveat for hand-written accents.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "600", "700"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["600", "700"], preload: false });

// Typefaces used by invoice templates — loaded on demand, not preloaded.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], preload: false });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], preload: false });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s, assets } = await getSite();
  const origin = await siteOrigin(s);
  const title = s.metaTitle || s.siteName;
  const ogImage = siteAssetUrl("og", assets) ?? "/site-asset/og";
  const favicon = siteAssetUrl("favicon", assets);
  return {
    metadataBase: new URL(origin),
    title: { default: title, template: `%s — ${s.siteName}` },
    description: s.metaDescription,
    keywords: s.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    applicationName: s.siteName,
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: s.siteName,
      title,
      description: s.metaDescription,
      url: "/",
      images: [{ url: ogImage, width: 1200, height: 630, alt: s.siteName }],
    },
    twitter: { card: "summary_large_image", title, description: s.metaDescription, images: [ogImage] },
    icons: favicon ? { icon: favicon, apple: favicon } : { icon: "/favicon.ico" },
    robots: s.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
  };
}

/** Brand colour from the admin settings, applied over the defaults in globals.css. */
function brandCss(color: string): string {
  const c = /^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_SITE.primaryColor;
  const dark = lighten(c, 0.3);
  return (
    `:root{--primary:${c};--primary-foreground:${contrastText(c)};--ring:${c};--sidebar-primary:${c};--chart-1:${c}}` +
    `.dark{--primary:${dark};--primary-foreground:${contrastText(dark)};--ring:${dark};--sidebar-primary:${dark};--chart-1:${dark}}`
  );
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

// Applies the saved light/dark choice before first paint (avoids a flash of the wrong theme).
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { settings } = await getSite();
  const fonts = [jakarta, bricolage, caveat, inter, playfair, jetbrains, cormorant, spaceGrotesk].map((f) => f.variable).join(" ");
  return (
    <html lang="id" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: brandCss(settings.primaryColor) }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ className: "rounded-xl" }} />
      </body>
    </html>
  );
}
