import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { Invoice } from "@/types/invoice";

export async function generatePDF(invoice: Invoice): Promise<void> {
  const element = document.getElementById("invoice-preview");
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  const clientName = invoice.clientName?.replace(/\s+/g, "-") || "Client";
  const filename = `INV-${clientName}-${invoice.invoiceNumber}.pdf`;
  pdf.save(filename);
}
