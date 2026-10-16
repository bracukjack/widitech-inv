import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, Playfair_Display, JetBrains_Mono, Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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

export const metadata: Metadata = {
  title: "Widitech Invoice — Buat invoice cepat",
  description: "Buat invoice profesional dalam hitungan detik. Banyak template, ekspor PDF, langsung kirim.",
};

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fonts = [dmSans, inter, playfair, jetbrains, cormorant, spaceGrotesk].map((f) => f.variable).join(" ");
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${fonts} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ className: "rounded-xl" }} />
      </body>
    </html>
  );
}
