import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { Invoice } from "@/types/invoice";
import { createRoot } from "react-dom/client";
import { createElement } from "react";

// A4 dimensions: 210mm x 297mm at 96dpi ≈ 794px x 1123px
const A4_WIDTH_PX = 794;
const A4_HEIGHT_MM = 297;
const PDF_WIDTH_MM = 210;
const CANVAS_SCALE = 2;

export async function generatePDF(invoice: Invoice): Promise<void> {
  const { default: InvoicePreview } = await import(
    "@/components/InvoicePreview"
  );

  // Off-screen container at exact A4 width, isolated from page styles
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "top:0",
    "left:-9999px",
    `width:${A4_WIDTH_PX}px`,
    "background:#ffffff",
    "overflow:visible",
    "z-index:-9999",
  ].join(";");
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // Render a fresh, isolated instance of the invoice preview
    await new Promise<void>((resolve) => {
      root.render(createElement(InvoicePreview, { invoice }));
      // Wait for React render + useEffect (logo load from localStorage)
      requestAnimationFrame(() => setTimeout(resolve, 200));
    });

    const previewEl = container.querySelector(
      "#invoice-preview"
    ) as HTMLElement | null;
    if (!previewEl) return;

    // Fix width to A4 and remove visual decorations
    previewEl.style.width = `${A4_WIDTH_PX}px`;
    previewEl.style.borderRadius = "0";
    previewEl.style.border = "none";
    previewEl.style.overflow = "visible";
    previewEl.style.minHeight = "auto";

    // Record section bounding boxes BEFORE canvas capture (DOM pixels,
    // relative to the top of the preview element)
    const previewRect = previewEl.getBoundingClientRect();
    const sectionRanges = Array.from(
      previewEl.querySelectorAll("[data-pdf-section]")
    ).map((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      return {
        top: rect.top - previewRect.top,
        bottom: rect.bottom - previewRect.top,
      };
    });

    // Capture the full invoice as a single high-res canvas
    const canvas = await html2canvas(previewEl, {
      scale: CANVAS_SCALE,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: A4_WIDTH_PX,
      windowWidth: A4_WIDTH_PX,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm

    // Top margin applied to pages 2+ (page 1 starts flush at y=0)
    const MARGIN_MM = 10;

    // Canvas pixels that fill one page of content:
    //   page 1 — full A4 height (no top margin)
    //   pages 2+ — A4 height minus the top margin reserved for breathing room
    const page1HeightPx = Math.round((A4_HEIGHT_MM * canvas.width) / PDF_WIDTH_MM);
    const pageNHeightPx = Math.round(((A4_HEIGHT_MM - MARGIN_MM) * canvas.width) / PDF_WIDTH_MM);
    const totalHeightPx = canvas.height;

    // Build section-aware page break positions (canvas pixel offsets)
    const pageStarts: number[] = [0];
    let pageStart = 0;
    let isFirstPage = true;

    while (true) {
      const currentPageHeightPx = isFirstPage ? page1HeightPx : pageNHeightPx;
      if (pageStart + currentPageHeightPx >= totalHeightPx) break;

      const idealBreak = pageStart + currentPageHeightPx;

      // Find sections that straddle the ideal cut line
      const straddling = sectionRanges.filter((s) => {
        const top = s.top * CANVAS_SCALE;
        const bottom = s.bottom * CANVAS_SCALE;
        return top < idealBreak && bottom > idealBreak;
      });

      let safeBreak: number;
      if (straddling.length === 0) {
        // No section spans the cut — safe to slice here
        safeBreak = idealBreak;
      } else {
        // Move cut up to before the earliest straddling section so it
        // starts intact on the next page
        const earliestTop = Math.min(
          ...straddling.map((s) => s.top * CANVAS_SCALE)
        );
        // Guard: if the section starts at/before the current page start it
        // is taller than a full page — accept the cut to avoid an infinite loop
        safeBreak =
          earliestTop > pageStart ? Math.floor(earliestTop) : idealBreak;
      }

      pageStarts.push(safeBreak);
      pageStart = safeBreak;
      isFirstPage = false;
    }

    // Slice the canvas and add each slice as a PDF page
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;

    pageStarts.forEach((start, i) => {
      const end =
        i + 1 < pageStarts.length ? pageStarts[i + 1] : totalHeightPx;
      const sliceHeightPx = end - start;
      const sliceHeightMM = (sliceHeightPx * PDF_WIDTH_MM) / canvas.width;

      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0, start, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx
      );

      // Page 1: flush to top (y=0). Pages 2+: offset by margin so content
      // doesn't start right at the paper edge.
      const yOffset = i === 0 ? 0 : MARGIN_MM;
      if (i > 0) pdf.addPage();
      pdf.addImage(
        sliceCanvas.toDataURL("image/png"),
        "PNG",
        0, yOffset, pdfWidth, sliceHeightMM
      );
    });

    const clientName = invoice.clientName?.replace(/\s+/g, "-") || "Client";
    pdf.save(`INV-${clientName}-${invoice.invoiceNumber}.pdf`);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
