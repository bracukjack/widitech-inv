import { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { Invoice, InvoiceBranding } from "@/types/invoice";
import { applyBranding, getTemplate } from "@/lib/themes";

const PDF_WIDTH_MM = 210;
const PDF_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 12; // top margin on pages 2+, bottom margin on every page
const CANVAS_SCALE = 2;

export function pdfFileName(invoice: Invoice): string {
  const client = (invoice.clientName || "client").trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  const num = invoice.invoiceNumber.replace(/[^\p{L}\p{N}-]+/gu, "-");
  return `${num}${client ? `-${client}` : ""}.pdf`;
}

/**
 * Renders the invoice off-screen at A4 width, rasterises it and slices it
 * into A4 pages, moving page breaks above any element marked
 * `data-pdf-section` so rows and blocks are never cut in half.
 */
export async function generatePdfBlob(invoice: Invoice, logo: string, branding?: InvoiceBranding | null): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }, { default: InvoiceDocument, DOC_WIDTH }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
    import("@/components/InvoiceDocument"),
  ]);

  const container = document.createElement("div");
  container.style.cssText = `position:fixed;top:0;left:-10000px;width:${DOC_WIDTH}px;pointer-events:none;`;
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    root.render(createElement(InvoiceDocument, { invoice, logo, branding, variant: "pdf" }));
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));
    await document.fonts?.ready;
    await Promise.all(
      Array.from(container.querySelectorAll("img")).map((img) =>
        img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r)))
      )
    );

    const doc = container.querySelector("#invoice-document") as HTMLElement | null;
    if (!doc) throw new Error("Invoice gagal dirender");

    const docTop = doc.getBoundingClientRect().top;
    const sections = Array.from(doc.querySelectorAll<HTMLElement>("[data-pdf-section]")).map((el) => {
      const r = el.getBoundingClientRect();
      return { top: (r.top - docTop) * CANVAS_SCALE, bottom: (r.bottom - docTop) * CANVAS_SCALE };
    });

    const pageBg = applyBranding(getTemplate(invoice.theme), branding).colors.pageBg;
    const canvas = await html2canvas(doc, {
      scale: CANVAS_SCALE,
      useCORS: true,
      backgroundColor: pageBg,
      logging: false,
      width: DOC_WIDTH,
      windowWidth: DOC_WIDTH,
    });

    const pxPerMm = canvas.width / PDF_WIDTH_MM;
    const firstPagePx = Math.floor((PDF_HEIGHT_MM - PAGE_MARGIN_MM) * pxPerMm);
    const nextPagePx = Math.floor((PDF_HEIGHT_MM - PAGE_MARGIN_MM * 2) * pxPerMm);

    // Work out where each page starts.
    const starts = [0];
    for (;;) {
      const start = starts[starts.length - 1];
      const ideal = start + (starts.length === 1 ? firstPagePx : nextPagePx);
      if (ideal >= canvas.height) break;
      const cut = sections.filter((s) => s.top < ideal && s.bottom > ideal);
      const earliest = cut.length ? Math.min(...cut.map((s) => s.top)) : ideal;
      // A section taller than a page can't be kept whole — cut it rather than loop forever.
      starts.push(earliest > start + 1 ? Math.floor(earliest) : ideal);
    }

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    const ctx = slice.getContext("2d")!;

    starts.forEach((start, i) => {
      const end = starts[i + 1] ?? canvas.height;
      const h = end - start;
      slice.height = h;
      ctx.fillStyle = pageBg;
      ctx.fillRect(0, 0, slice.width, h);
      ctx.drawImage(canvas, 0, start, canvas.width, h, 0, 0, canvas.width, h);

      if (i > 0) pdf.addPage();
      pdf.setFillColor(pageBg);
      pdf.rect(0, 0, PDF_WIDTH_MM, PDF_HEIGHT_MM, "F");
      pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, i === 0 ? 0 : PAGE_MARGIN_MM, PDF_WIDTH_MM, h / pxPerMm);
    });

    return pdf.output("blob");
  } finally {
    root.unmount();
    container.remove();
  }
}

export async function downloadPdf(invoice: Invoice, logo: string, branding?: InvoiceBranding | null): Promise<void> {
  const blob = await generatePdfBlob(invoice, logo, branding);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdfFileName(invoice);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  return navigator.canShare({ files: [new File([""], "x.pdf", { type: "application/pdf" })] });
}

export async function makePdfFile(invoice: Invoice, logo: string, branding?: InvoiceBranding | null): Promise<File> {
  const blob = await generatePdfBlob(invoice, logo, branding);
  return new File([blob], pdfFileName(invoice), { type: "application/pdf" });
}

/**
 * Opens the native share sheet with the PDF attached. Resolves to "needs-gesture"
 * when the browser (Safari) rejects the call because generating the PDF took
 * longer than the click's user-activation window — the caller should offer a
 * second tap that calls this again with the same file.
 */
export async function shareFile(file: File, title: string, text: string): Promise<"shared" | "needs-gesture"> {
  try {
    await navigator.share({ files: [file], title, text });
  } catch (e) {
    const name = (e as Error).name;
    if (name === "NotAllowedError") return "needs-gesture";
    if (name !== "AbortError") throw e; // closing the share sheet is not an error
  }
  return "shared";
}
