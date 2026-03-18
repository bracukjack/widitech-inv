"use client";

import { useState } from "react";
import { useInvoiceDraftStore } from "@/lib/invoiceDraftStore";
import InvoicePreview from "@/components/InvoicePreview";
import ThemePicker from "@/components/ThemePicker";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

export default function LivePreviewPanel() {
  const draft = useInvoiceDraftStore((s) => s.draft);
  const updateDraft = useInvoiceDraftStore((s) => s.updateDraft);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!draft) return null;

  const handleThemeChange = (theme: string) => {
    updateDraft({ theme });
  };

  return (
    <>
      {/* Desktop: always visible sticky panel */}
      <div className="hidden xl:flex xl:flex-col sticky top-6 gap-3">
        <ThemePicker value={draft.theme} onChange={handleThemeChange} />
        {/* A4 aspect-ratio container — preview fills the column, never clips */}
        <div
          className="w-full relative overflow-hidden rounded-lg"
          style={{ aspectRatio: "210 / 297" }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "153.9%", /* 100% / 0.65 */
              transform: "scale(0.65)",
              transformOrigin: "top left",
            }}
          >
            <InvoicePreview invoice={draft} />
          </div>
        </div>
      </div>

      {/* Tablet: collapsible side panel */}
      <div className="hidden md:block xl:hidden fixed top-20 right-0 z-40">
        {!mobileOpen && (
          <Button
            size="sm"
            className="rounded-l-lg rounded-r-none shadow-lg"
            onClick={() => setMobileOpen(true)}
          >
            <Eye className="size-4 mr-1" /> Preview
          </Button>
        )}
        {mobileOpen && (
          <div className="fixed inset-y-0 right-0 w-[480px] bg-background border-l border-border shadow-xl z-50 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Preview</h3>
              <Button variant="ghost" size="icon-xs" onClick={() => setMobileOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div style={{ transform: "scale(0.55)", transformOrigin: "top left", width: "181.8%" }}>
              <InvoicePreview invoice={draft} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile: full-screen modal */}
      <div className="md:hidden fixed bottom-4 right-4 z-40">
        {!mobileOpen && (
          <Button size="sm" className="rounded-full shadow-lg" onClick={() => setMobileOpen(true)}>
            <Eye className="size-4 mr-1" /> Preview
          </Button>
        )}
        {mobileOpen && (
          <div className="fixed inset-0 bg-background z-50 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Invoice Preview</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <div style={{ transform: "scale(0.48)", transformOrigin: "top left", width: "208.3%" }}>
              <InvoicePreview invoice={draft} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
