"use client";

import { useEffect, useState } from "react";
import { Invoice } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatCurrency";
import { getLogo } from "@/lib/invoiceStore";
import { getTheme, type ThemeConfig } from "@/lib/themes";
import { format } from "date-fns";

interface InvoicePreviewProps {
  invoice: Invoice;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function calculateTotals(invoice: Invoice) {
  const subtotal = invoice.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  let discount = 0;
  if (invoice.discountType === "percentage") {
    discount = subtotal * (invoice.discountValue / 100);
  } else {
    discount = invoice.discountValue;
  }

  const afterDiscount = subtotal - discount;

  let tax = 0;
  const taxType = invoice.taxType || "percentage";
  if (taxType === "percentage") {
    tax = afterDiscount * (invoice.taxRate / 100);
  } else {
    tax = invoice.taxRate;
  }

  const total = afterDiscount + tax;

  return { subtotal, discount, afterDiscount, tax, total };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "MMM dd, yyyy");
  } catch {
    return dateStr;
  }
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { subtotal, discount, tax, total } = calculateTotals(invoice);
  const theme = getTheme(invoice.theme);
  const [logo, setLogo] = useState("");

  useEffect(() => {
    setLogo(getLogo());
  }, []);

  const isFullHeader = theme.headerStyle === "full" || theme.headerStyle === "split";

  return (
    <div
      id="invoice-preview"
      style={{
        background: theme.bodyBg,
        color: theme.bodyText,
        fontFamily: theme.fontFamily,
        minHeight: "842px",
        borderRadius: "8px",
        overflow: "hidden",
        border: `1px solid ${theme.borderColor}`,
      }}
    >
      {/* Accent bar for accent-bar style */}
      {theme.headerStyle === "accent-bar" && (
        <div style={{ height: "4px", background: theme.accentColor }} />
      )}

      {/* Header */}
      <div
        style={{
          padding: "24px 32px",
          background: isFullHeader ? theme.headerBg : theme.bodyBg,
          color: isFullHeader ? theme.headerText : theme.bodyText,
          borderBottom: !isFullHeader ? `2px solid ${theme.borderColor}` : "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {logo ? (
              <img
                src={logo}
                alt="Logo"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  border: isFullHeader ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${theme.borderColor}`,
                }}
              />
            ) : invoice.freelancerName ? (
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 700,
                  background: isFullHeader ? "rgba(255,255,255,0.2)" : theme.badgeBg,
                  color: isFullHeader ? theme.headerText : theme.accentColor,
                }}
              >
                {getInitials(invoice.freelancerName)}
              </div>
            ) : null}
            <div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: theme.headingWeight,
                  color: isFullHeader ? theme.headerText : theme.bodyText,
                  margin: 0,
                }}
              >
                {invoice.freelancerName || "Your Name"}
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  marginTop: "4px",
                  color: isFullHeader ? `${theme.headerText}cc` : theme.mutedText,
                }}
              >
                {invoice.freelancerEmail}
              </p>
              {invoice.freelancerPhone && (
                <p
                  style={{
                    fontSize: "14px",
                    color: isFullHeader ? `${theme.headerText}cc` : theme.mutedText,
                    margin: 0,
                  }}
                >
                  {invoice.freelancerPhone}
                </p>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2
              style={{
                fontSize: "30px",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: isFullHeader ? theme.headerText : theme.bodyText,
                margin: 0,
              }}
            >
              INVOICE
            </h2>
            <p
              style={{
                fontSize: "14px",
                marginTop: "4px",
                fontWeight: 500,
                color: isFullHeader ? `${theme.headerText}e6` : theme.mutedText,
              }}
            >
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 32px" }}>
        {/* Client & Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "24px" }}>
          <div>
            <h3
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                color: theme.mutedText,
                marginBottom: "8px",
              }}
            >
              Bill To
            </h3>
            <p style={{ fontWeight: 600, color: theme.bodyText, margin: 0 }}>
              {invoice.clientName || "Client Name"}
            </p>
            {invoice.clientCompany && (
              <p style={{ fontSize: "14px", color: theme.mutedText, margin: "2px 0" }}>{invoice.clientCompany}</p>
            )}
            {invoice.clientEmail && (
              <p style={{ fontSize: "14px", color: theme.mutedText, margin: "2px 0" }}>{invoice.clientEmail}</p>
            )}
            {invoice.clientPhone && (
              <p style={{ fontSize: "14px", color: theme.mutedText, margin: "2px 0" }}>{invoice.clientPhone}</p>
            )}
            {invoice.clientAddress && (
              <p style={{ fontSize: "14px", color: theme.mutedText, margin: "2px 0" }}>{invoice.clientAddress}</p>
            )}
            {invoice.clientCountry && (
              <p style={{ fontSize: "14px", color: theme.mutedText, margin: "2px 0" }}>{invoice.clientCountry}</p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, color: theme.mutedText }}>
                  Invoice Date
                </span>
                <span style={{ fontSize: "14px", fontWeight: 500, color: theme.bodyText, width: "112px", textAlign: "right" }}>
                  {formatDate(invoice.invoiceDate)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, color: theme.mutedText }}>
                  Due Date
                </span>
                <span style={{ fontSize: "14px", fontWeight: 500, color: theme.bodyText, width: "112px", textAlign: "right" }}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, color: theme.mutedText }}>
                  Status
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "112px",
                    textAlign: "right",
                    color:
                      invoice.status === "Paid"
                        ? "#16a34a"
                        : invoice.status === "Sent"
                          ? "#2563eb"
                          : theme.mutedText,
                  }}
                >
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: theme.tableHeaderBg }}>
              <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, color: theme.tableHeaderText, borderRadius: "6px 0 0 0" }}>
                Description
              </th>
              <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: theme.tableHeaderText, width: "64px" }}>
                Qty
              </th>
              <th style={{ textAlign: "right", padding: "12px", fontWeight: 600, color: theme.tableHeaderText, width: "128px" }}>
                Unit Price
              </th>
              <th style={{ textAlign: "right", padding: "12px", fontWeight: 600, color: theme.tableHeaderText, width: "128px", borderRadius: "0 6px 0 0" }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr
                key={item.id || i}
                style={{ borderBottom: `1px solid ${theme.borderColor}` }}
              >
                <td style={{ padding: "12px", color: theme.bodyText }}>
                  {item.description || "-"}
                </td>
                <td style={{ padding: "12px", textAlign: "center", color: theme.mutedText }}>
                  {item.quantity}
                </td>
                <td style={{ padding: "12px", textAlign: "right", color: theme.mutedText }}>
                  {formatCurrency(item.unitPrice, invoice.currency)}
                </td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 500, color: theme.bodyText }}>
                  {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <div style={{ width: "288px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "6px" }}>
              <span style={{ color: theme.mutedText }}>Subtotal</span>
              <span style={{ fontWeight: 500, color: theme.bodyText }}>
                {formatCurrency(subtotal, invoice.currency)}
              </span>
            </div>
            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "6px" }}>
                <span style={{ color: theme.mutedText }}>
                  Discount{invoice.discountType === "percentage" ? ` (${invoice.discountValue}%)` : ""}
                </span>
                <span style={{ fontWeight: 500, color: "#EF4444" }}>
                  -{formatCurrency(discount, invoice.currency)}
                </span>
              </div>
            )}
            {tax > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "6px" }}>
                <span style={{ color: theme.mutedText }}>
                  Tax{(invoice.taxType || "percentage") === "percentage" ? ` (${invoice.taxRate}%)` : ""}
                </span>
                <span style={{ fontWeight: 500, color: theme.bodyText }}>
                  {formatCurrency(tax, invoice.currency)}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16px",
                fontWeight: 700,
                paddingTop: "8px",
                borderTop: `2px solid ${theme.accentColor}`,
                color: theme.accentColor,
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {(invoice.freelancerBankName || invoice.freelancerBankAccount) && (
          <div
            style={{
              background: theme.badgeBg,
              borderRadius: "8px",
              padding: "16px",
              marginTop: "24px",
            }}
          >
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                color: theme.mutedText,
                marginBottom: "8px",
              }}
            >
              Payment Details
            </h4>
            {invoice.paymentMethod && (
              <p style={{ fontSize: "14px", color: theme.bodyText, margin: "2px 0" }}>
                <span style={{ fontWeight: 500 }}>Method:</span> {invoice.paymentMethod}
              </p>
            )}
            {invoice.freelancerBankName && (
              <p style={{ fontSize: "14px", color: theme.bodyText, margin: "2px 0" }}>
                <span style={{ fontWeight: 500 }}>Bank:</span> {invoice.freelancerBankName}
              </p>
            )}
            {invoice.freelancerBankAccount && (
              <p style={{ fontSize: "14px", color: theme.bodyText, margin: "2px 0" }}>
                <span style={{ fontWeight: 500 }}>Account:</span> {invoice.freelancerBankAccount}
              </p>
            )}
            {invoice.freelancerName && (
              <p style={{ fontSize: "14px", color: theme.bodyText, margin: "2px 0" }}>
                <span style={{ fontWeight: 500 }}>Account Holder:</span> {invoice.freelancerName}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginTop: "24px" }}>
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                color: theme.mutedText,
                marginBottom: "8px",
              }}
            >
              Notes / Terms
            </h4>
            <p style={{ fontSize: "14px", color: theme.mutedText, whiteSpace: "pre-wrap" }}>
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            paddingTop: "24px",
            marginTop: "24px",
            borderTop: `1px solid ${theme.borderColor}`,
          }}
        >
          <p style={{ fontSize: "14px", fontWeight: 500, color: theme.accentColor }}>
            Thank you for your business
          </p>
        </div>
      </div>
    </div>
  );
}

export { calculateTotals };
