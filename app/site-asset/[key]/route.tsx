import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";
import { getSite, getSiteAsset } from "@/lib/site";
import { contrastText, SITE_ASSET_KEYS, type SiteAssetKey } from "@/lib/site-config";

// Serves admin-uploaded site images from the database. Requests carry ?v=<updatedAt>,
// so a changed image gets a new URL and responses can be cached aggressively.
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!(SITE_ASSET_KEYS as readonly string[]).includes(key)) return new NextResponse("Not found", { status: 404 });

  const versioned = request.nextUrl.searchParams.has("v");
  const cacheControl = versioned ? "public, max-age=31536000, immutable" : "public, max-age=300";

  const asset = await getSiteAsset(key as SiteAssetKey).catch(() => null);
  if (asset) {
    return new NextResponse(Buffer.from(asset.data, "base64"), {
      headers: { "Content-Type": asset.mime, "Cache-Control": cacheControl },
    });
  }

  if (key === "favicon") return NextResponse.redirect(new URL("/favicon.ico", request.url));
  if (key === "og") return generatedOgImage();
  return new NextResponse("Not found", { status: 404 });
}

/** Default 1200×630 share image built from the site name, tagline and brand colour. */
async function generatedOgImage() {
  const { settings: s, landing } = await getSite();
  const fg = contrastText(s.primaryColor);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: s.primaryColor,
          color: fg,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 700 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: fg,
              color: s.primaryColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            {s.siteName.charAt(0).toUpperCase()}
          </div>
          {s.siteName}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>{landing.hero.title || s.metaTitle}</div>
          <div style={{ fontSize: 30, opacity: 0.85 }}>{s.tagline}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=300" } }
  );
}
