import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { Invoice } from "@/types/invoice";
import { createRoot } from "react-dom/client";
import { createElement } from "react";

// A4 dimensions: 210mm x 297mm at 96dpi ≈ 794px x 1123px
const A4_WIDTH_PX = 794;
const A4_HEIGHT_MM = 297;

export async function generatePDF(invoice: Invoice): Promise<void> {
  // Dynamically import to avoid SSR issues
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

    // Remove visual decorations not needed in PDF
    previewEl.style.borderRadius = "0";
    previewEl.style.border = "none";
    previewEl.style.overflow = "visible";
    previewEl.style.minHeight = "auto";

    const canvas = await html2canvas(previewEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: A4_WIDTH_PX,
      windowWidth: A4_WIDTH_PX,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const imgHeightMM = (canvas.height * pdfWidth) / canvas.width;

    // Multi-page support
    if (imgHeightMM <= A4_HEIGHT_MM) {
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeightMM);
    } else {
      let yOffset = 0;
      while (yOffset < imgHeightMM) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, pdfWidth, imgHeightMM);
        yOffset += A4_HEIGHT_MM;
      }
    }

    const clientName = invoice.clientName?.replace(/\s+/g, "-") || "Client";
    const filename = `INV-${clientName}-${invoice.invoiceNumber}.pdf`;
    pdf.save(filename);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
