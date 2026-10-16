import type { MetadataRoute } from "next";
import { getSite, siteOrigin } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { settings } = await getSite();
  const origin = await siteOrigin(settings);
  return [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/register`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/login`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
