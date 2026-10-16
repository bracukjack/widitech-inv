import type { MetadataRoute } from "next";
import { getSite, siteOrigin } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getSite();
  const origin = await siteOrigin(settings);
  if (!settings.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: ["/", "/login", "/register"], disallow: ["/invoices", "/invoice/", "/settings", "/admin"] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
