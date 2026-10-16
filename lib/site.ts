import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { mergeLanding, type LandingContent } from "@/lib/landing";
import { DEFAULT_SITE, SITE_ASSET_KEYS, type SiteAssetKey, type SiteAssetVersions, type SiteSettings } from "@/lib/site-config";

export interface SiteData {
  settings: SiteSettings;
  assets: SiteAssetVersions;
  landing: LandingContent;
}

/** Rows of the site_settings table. */
export const SITE_ROW = 1;
export const LANDING_ROW = 2;

function merge(raw: Record<string, unknown> | undefined): SiteSettings {
  const out = { ...DEFAULT_SITE };
  if (!raw) return out;
  for (const key of Object.keys(DEFAULT_SITE) as (keyof SiteSettings)[]) {
    const v = raw[key];
    if (typeof v === typeof DEFAULT_SITE[key]) (out as Record<string, unknown>)[key] = v;
  }
  return out;
}

let warned = false;

/**
 * Site settings + which images exist. Cached per request; falls back to the
 * defaults if the database isn't reachable so public pages still render.
 */
export const getSite = cache(async (): Promise<SiteData> => {
  try {
    const rows = await db().select().from(schema.siteSettings);
    const row = rows.find((r) => r.id === SITE_ROW);
    const landingRow = rows.find((r) => r.id === LANDING_ROW);
    const assets = await db()
      .select({ key: schema.siteAssets.key, updatedAt: schema.siteAssets.updatedAt })
      .from(schema.siteAssets);
    const versions: SiteAssetVersions = {};
    for (const a of assets) {
      if ((SITE_ASSET_KEYS as readonly string[]).includes(a.key)) versions[a.key as SiteAssetKey] = a.updatedAt.getTime();
    }
    return { settings: merge(row?.data), assets: versions, landing: mergeLanding(landingRow?.data) };
  } catch (e) {
    if (!warned) {
      warned = true;
      const reason = (e as Error).message.split("\n")[0];
      console.warn(`[site] Pengaturan situs tidak bisa dimuat, memakai default. (${reason})`);
    }
    return { settings: { ...DEFAULT_SITE }, assets: {}, landing: mergeLanding(null) };
  }
});

/** The configured site URL, or the origin of the current request. */
export async function siteOrigin(settings: SiteSettings): Promise<string> {
  if (settings.siteUrl) return settings.siteUrl.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function getSiteAsset(key: SiteAssetKey) {
  const [row] = await db().select().from(schema.siteAssets).where(eq(schema.siteAssets.key, key)).limit(1);
  return row ?? null;
}
