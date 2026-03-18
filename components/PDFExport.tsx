"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { generatePDF } from "@/lib/pdfGenerator";
import { useState } from "react";

interface PDFExportProps {
  invoice: Invoice;
}

export default function PDFExport({ invoice }: PDFExportProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await generatePDF(invoice);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={loading} variant="outline">
      <Download className="size-4 mr-1.5" />
      {loading ? "Generating..." : "Download PDF"}
    </Button>
  );
}
