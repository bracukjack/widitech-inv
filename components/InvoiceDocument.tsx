import type { CSSProperties, ReactNode } from "react";
import type { Invoice, InvoiceLanguage, PaymentMethod } from "@/types/invoice";
import { calculateTotals, formatCurrency, formatDate, formatNumber, lineTotal, stageAmount } from "@/lib/invoice";
import { fontStack, getTemplate, type TemplateConfig } from "@/lib/themes";

/** A4 width at 96dpi — the document is always laid out at this width and scaled for display. */
export const DOC_WIDTH = 794;
export const DOC_HEIGHT = 1123;

const LABELS = {
  id: {
    invoice: "INVOICE",
    billTo: "Ditagihkan kepada",
    number: "No. Invoice",
    date: "Tanggal",
    due: "Jatuh tempo",
    description: "Deskripsi",
    qty: "Qty",
    price: "Harga",
    amount: "Jumlah",
    subtotal: "Subtotal",
    discount: "Diskon",
    tax: "Pajak",
    total: "Total",
    paidSoFar: "Sudah dibayar",
    balance: "Sisa tagihan",
    schedule: "Termin pembayaran",
    stage: "Termin",
    stagePaid: "Lunas",
    stageDue: "Belum",
    payment: "Informasi pembayaran",
    method: "Metode",
    bank: "Bank",
    account: "No. rekening",
    accountName: "Atas nama",
    notes: "Catatan",
    thanks: "Terima kasih atas kepercayaan Anda",
    paidStamp: "LUNAS",
  },
  en: {
    invoice: "INVOICE",
    billTo: "Bill to",
    number: "Invoice No.",
    date: "Date",
    due: "Due date",
    description: "Description",
    qty: "Qty",
    price: "Price",
    amount: "Amount",
    subtotal: "Subtotal",
    discount: "Discount",
    tax: "Tax",
    total: "Total",
    paidSoFar: "Paid",
    balance: "Balance due",
    schedule: "Payment schedule",
    stage: "Stage",
    stagePaid: "Paid",
    stageDue: "Due",
    payment: "Payment details",
    method: "Method",
    bank: "Bank",
    account: "Account no.",
    accountName: "Account name",
    notes: "Notes",
    thanks: "Thank you for your business",
    paidStamp: "PAID",
  },
} satisfies Record<InvoiceLanguage, Record<string, string>>;

const METHOD_ID: Partial<Record<PaymentMethod, string>> = {
  "Bank Transfer": "Transfer Bank",
  Cash: "Tunai",
  Other: "Lainnya",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface InvoiceDocumentProps {
  invoice: Invoice;
  logo?: string;
  /** "pdf" drops the page frame and min-height so the capture is tight. */
  variant?: "screen" | "pdf";
  /** Renders with this template instead of the invoice's own one. */
  template?: TemplateConfig;
}

export default function InvoiceDocument({ invoice, logo, variant = "screen", template }: InvoiceDocumentProps) {
  const t = template ?? getTemplate(invoice.theme);
  const c = t.colors;
  const L = LABELS[invoice.language] ?? LABELS.en;
  const totals = calculateTotals(invoice);
  const money = (n: number) => formatCurrency(n, invoice.currency);

  const items = invoice.lineItems.filter((li) => li.description.trim() || li.unitPrice);
  // Service invoices usually bill "1 x amount" — hide qty/price columns until they carry information.
  const showQty = items.some((li) => li.quantity !== 1);
  const scheduled = invoice.paymentScheduleType === "scheduled" && invoice.paymentStages.length > 0;
  const hasBank = Boolean(invoice.freelancerBankName || invoice.freelancerBankAccount);
  const methodLabel = invoice.language === "id" ? METHOD_ID[invoice.paymentMethod] ?? invoice.paymentMethod : invoice.paymentMethod;

  const label: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: c.muted,
    margin: "0 0 8px",
  };

  return (
    <div
      id="invoice-document"
      style={{
        position: "relative",
        width: "100%",
        background: c.pageBg,
        color: c.text,
        fontFamily: fontStack(t.font),
        fontSize: 13.5,
        lineHeight: 1.5,
        minHeight: variant === "screen" ? DOC_HEIGHT : undefined,
        boxSizing: "border-box",
      }}
    >
      <Header invoice={invoice} template={t} logo={logo} invoiceLabel={L.invoice} />

      <div style={{ padding: "28px 48px 40px" }}>
        {/* Bill to + dates */}
        <div data-pdf-section style={{ display: "flex", justifyContent: "space-between", gap: 32, marginBottom: 28 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={label}>{L.billTo}</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.text }}>{invoice.clientName || "—"}</p>
            {[invoice.clientCompany, invoice.clientAddress, invoice.clientCountry, invoice.clientEmail, invoice.clientPhone]
              .filter(Boolean)
              .map((line, i) => (
                <p key={i} style={{ margin: "2px 0 0", color: c.muted, whiteSpace: "pre-line" }}>
                  {line}
                </p>
              ))}
          </div>
          <table style={{ borderCollapse: "collapse", alignSelf: "flex-start" }}>
            <tbody>
              {[
                [L.number, invoice.invoiceNumber],
                [L.date, formatDate(invoice.invoiceDate, invoice.language)],
                [L.due, formatDate(invoice.dueDate, invoice.language)],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ ...label, margin: 0, padding: "3px 16px 3px 0", textAlign: "right" }}>{k}</td>
                  <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ItemsTable template={t} items={items} showQty={showQty} labels={L} money={money} currency={invoice.currency} />

        {/* Totals */}
        <div data-pdf-section style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <div style={{ width: 300 }}>
            <Row label={L.subtotal} value={money(totals.subtotal)} muted={c.muted} />
            {totals.discount > 0 && (
              <Row
                label={`${L.discount}${invoice.discountType === "percentage" ? ` (${invoice.discountValue}%)` : ""}`}
                value={`−${money(totals.discount)}`}
                muted={c.muted}
              />
            )}
            {totals.tax > 0 && (
              <Row
                label={`${L.tax}${invoice.taxType === "percentage" ? ` (${invoice.taxRate}%)` : ""}`}
                value={money(totals.tax)}
                muted={c.muted}
              />
            )}
            {t.totalStyle === "box" ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: c.accent,
                  color: "#FFFFFF",
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                <span>{L.total}</span>
                <span>{money(totals.total)}</span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                  paddingTop: 10,
                  borderTop: `2px solid ${c.accent}`,
                  color: c.accent,
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                <span>{L.total}</span>
                <span>{money(totals.total)}</span>
              </div>
            )}
            {totals.paid > 0 && invoice.status !== "Paid" && (
              <>
                <Row label={L.paidSoFar} value={`−${money(totals.paid)}`} muted={c.muted} style={{ marginTop: 8 }} />
                <Row label={L.balance} value={money(totals.balance)} muted={c.text} bold />
              </>
            )}
          </div>
        </div>

        {scheduled && (
          <div data-pdf-section style={{ marginTop: 28, padding: "16px 20px", background: c.soft, borderRadius: 8 }}>
            <p style={label}>{L.schedule}</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {invoice.paymentStages.map((s, i) => (
                  <tr key={s.id} style={{ borderTop: i ? `1px solid ${c.border}` : undefined }}>
                    <td style={{ padding: "6px 0", fontWeight: 500 }}>{s.name || `${L.stage} ${i + 1}`}</td>
                    <td style={{ padding: "6px 0", color: c.muted, textAlign: "right" }}>
                      {s.dueDate ? formatDate(s.dueDate, invoice.language) : ""}
                    </td>
                    <td style={{ padding: "6px 0 6px 16px", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {money(stageAmount(s, totals.total))}
                    </td>
                    <td style={{ padding: "6px 0 6px 12px", textAlign: "right", width: 64 }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: s.isPaid || invoice.status === "Paid" ? "#DCFCE7" : "#FEF3C7",
                          color: s.isPaid || invoice.status === "Paid" ? "#15803D" : "#A16207",
                        }}
                      >
                        {s.isPaid || invoice.status === "Paid" ? L.stagePaid : L.stageDue}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment details, notes and the closing line page-break together so the footer is never orphaned. */}
        <div data-pdf-section>
        {(hasBank || invoice.notes) && (
          <div style={{ display: "flex", gap: 24, marginTop: 28 }}>
            {hasBank && (
              <div style={{ flex: 1, padding: "16px 20px", background: c.soft, borderRadius: 8 }}>
                <p style={label}>{L.payment}</p>
                <KeyVal k={L.method} v={methodLabel} muted={c.muted} />
                {invoice.freelancerBankName && <KeyVal k={L.bank} v={invoice.freelancerBankName} muted={c.muted} />}
                {invoice.freelancerBankAccount && (
                  <KeyVal k={L.account} v={invoice.freelancerBankAccount} muted={c.muted} strong />
                )}
                {(invoice.freelancerBankAccountName || invoice.freelancerName) && (
                  <KeyVal k={L.accountName} v={invoice.freelancerBankAccountName || invoice.freelancerName} muted={c.muted} />
                )}
              </div>
            )}
            {invoice.notes && (
              <div style={{ flex: 1, padding: hasBank ? "16px 0" : 0 }}>
                <p style={label}>{L.notes}</p>
                <p style={{ margin: 0, color: c.muted, whiteSpace: "pre-wrap" }}>{invoice.notes}</p>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 36, paddingTop: 20, borderTop: `1px solid ${c.border}`, textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 600, color: c.accent }}>{L.thanks}</p>
        </div>
        </div>
      </div>

      {invoice.status === "Paid" && (
        <div
          style={{
            position: "absolute",
            top: 210,
            right: 56,
            transform: "rotate(-12deg)",
            border: "3px solid #16A34A",
            color: "#16A34A",
            borderRadius: 8,
            padding: "4px 18px",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "0.12em",
            opacity: 0.8,
            fontFamily: "var(--font-inter), Arial, sans-serif",
          }}
        >
          {L.paidStamp}
        </div>
      )}
    </div>
  );
}

// --- header layouts ---

function Header({
  invoice,
  template: t,
  logo,
  invoiceLabel,
}: {
  invoice: Invoice;
  template: TemplateConfig;
  logo?: string;
  invoiceLabel: string;
}) {
  const c = t.colors;
  const contact = [invoice.freelancerEmail, invoice.freelancerPhone].filter(Boolean).join("  ·  ");

  const brand = (onDark: boolean, align: "left" | "center" = "left") => (
    <div
      style={{
        display: "flex",
        flexDirection: align === "center" ? "column" : "row",
        alignItems: "center",
        gap: align === "center" ? 10 : 16,
        textAlign: align,
        minWidth: 0,
      }}
    >
      <Logo logo={logo} name={invoice.freelancerName} accent={c.accent} onDark={onDark} />
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 21,
            fontWeight: t.headingWeight,
            lineHeight: 1.25,
            color: onDark ? c.headerText : c.text,
          }}
        >
          {invoice.freelancerName || "Nama Bisnis Anda"}
        </p>
        {contact && (
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: onDark ? c.headerText : c.muted, opacity: onDark ? 0.85 : 1 }}>
            {contact}
          </p>
        )}
        {invoice.freelancerAddress && (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12.5,
              color: onDark ? c.headerText : c.muted,
              opacity: onDark ? 0.85 : 1,
              whiteSpace: "pre-line",
            }}
          >
            {invoice.freelancerAddress}
          </p>
        )}
      </div>
    </div>
  );

  const title = (color: string, size = 34) => (
    <p style={{ margin: 0, fontSize: size, fontWeight: 800, letterSpacing: "0.04em", lineHeight: 1, color }}>
      {invoiceLabel}
    </p>
  );

  switch (t.layout) {
    case "band":
      return (
        <div data-pdf-section style={{ background: c.headerBg, padding: "36px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          {brand(true)}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {title(c.headerText)}
            <p style={{ margin: "8px 0 0", color: c.headerText, opacity: 0.85, fontWeight: 500 }}>#{invoice.invoiceNumber}</p>
          </div>
        </div>
      );
    case "split":
      return (
        <div data-pdf-section style={{ display: "flex", alignItems: "stretch" }}>
          <div style={{ flex: 1, padding: "36px 32px 32px 48px", display: "flex", alignItems: "center", minWidth: 0 }}>
            {brand(false)}
          </div>
          <div
            style={{
              width: 260,
              flexShrink: 0,
              background: c.headerBg,
              padding: "36px 48px 32px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-end",
              borderBottomLeftRadius: 28,
            }}
          >
            {title(c.headerText, 30)}
            <p style={{ margin: "8px 0 0", color: c.headerText, opacity: 0.9, fontWeight: 500 }}>#{invoice.invoiceNumber}</p>
          </div>
        </div>
      );
    case "centered":
      return (
        <div data-pdf-section style={{ padding: "40px 48px 8px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>{brand(false, "center")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24 }}>
            <div style={{ flex: 1, height: 1, background: c.accent, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: "0.3em", color: c.accent }}>
              {invoiceLabel}
            </p>
            <div style={{ flex: 1, height: 1, background: c.accent, opacity: 0.4 }} />
          </div>
        </div>
      );
    case "accent":
      return (
        <div data-pdf-section>
          <div style={{ height: 8, background: c.accent }} />
          <div style={{ padding: "32px 48px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
            {brand(false)}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {title(c.accent, 36)}
              <p style={{ margin: "8px 0 0", color: c.muted, fontWeight: 500 }}>#{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>
      );
    case "minimal":
    default:
      return (
        <div data-pdf-section style={{ padding: "40px 48px 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 24,
              paddingBottom: 24,
              borderBottom: `2px solid ${c.text}`,
            }}
          >
            {brand(false)}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {title(c.text, 32)}
              <p style={{ margin: "8px 0 0", color: c.muted, fontWeight: 500 }}>#{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>
      );
  }
}

function Logo({ logo, name, accent, onDark }: { logo?: string; name: string; accent: string; onDark: boolean }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 10, flexShrink: 0, background: onDark ? "#FFFFFF" : "transparent" }}
      />
    );
  }
  if (!name) return null;
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 19,
        fontWeight: 700,
        background: onDark ? "rgba(255,255,255,0.18)" : accent,
        color: "#FFFFFF",
      }}
    >
      {initials(name)}
    </div>
  );
}

// --- items table ---

function ItemsTable({
  template: t,
  items,
  showQty,
  labels: L,
  money,
  currency,
}: {
  template: TemplateConfig;
  items: Invoice["lineItems"];
  showQty: boolean;
  labels: (typeof LABELS)["id"];
  money: (n: number) => string;
  currency: Invoice["currency"];
}) {
  const c = t.colors;
  const headBg = t.table === "lines" ? "transparent" : c.tableHeaderBg;
  const th: CSSProperties = {
    padding: "11px 14px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: c.tableHeaderText,
    background: headBg,
    borderBottom: t.table === "lines" ? `2px solid ${c.text}` : "none",
    textAlign: "left",
  };
  const right: CSSProperties = { textAlign: "right" };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr data-pdf-section>
          <th style={{ ...th, borderRadius: t.table === "lines" ? 0 : "6px 0 0 6px" }}>{L.description}</th>
          {showQty && <th style={{ ...th, ...right, width: 60 }}>{L.qty}</th>}
          {showQty && <th style={{ ...th, ...right, width: 130 }}>{L.price}</th>}
          <th style={{ ...th, ...right, width: 150, borderRadius: t.table === "lines" ? 0 : "0 6px 6px 0" }}>{L.amount}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr
            key={item.id}
            data-pdf-section
            style={{
              background: t.table === "striped" && i % 2 === 1 ? c.soft : "transparent",
              borderBottom: t.table === "striped" ? "none" : `1px solid ${c.border}`,
            }}
          >
            <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{item.description || "—"}</p>
              {item.notes && (
                <p style={{ margin: "3px 0 0", fontSize: 12.5, color: c.muted, whiteSpace: "pre-wrap" }}>{item.notes}</p>
              )}
            </td>
            {showQty && (
              <td style={{ padding: "12px 14px", ...right, verticalAlign: "top", color: c.muted }}>
                {formatNumber(item.quantity, "USD")}
              </td>
            )}
            {showQty && (
              <td style={{ padding: "12px 14px", ...right, verticalAlign: "top", color: c.muted, whiteSpace: "nowrap" }}>
                {formatNumber(item.unitPrice, currency)}
              </td>
            )}
            <td style={{ padding: "12px 14px", ...right, verticalAlign: "top", fontWeight: 600, whiteSpace: "nowrap" }}>
              {money(lineTotal(item))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// --- small bits ---

function Row({
  label,
  value,
  muted,
  bold,
  style,
}: {
  label: string;
  value: string;
  muted: string;
  bold?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: bold ? 700 : 400, ...style }}>
      <span style={{ color: muted }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}

function KeyVal({ k, v, muted, strong }: { k: string; v: ReactNode; muted: string; strong?: boolean }) {
  return (
    <p style={{ margin: "2px 0", display: "flex", gap: 8 }}>
      <span style={{ color: muted, minWidth: 96 }}>{k}</span>
      <span style={{ fontWeight: strong ? 700 : 500 }}>{v}</span>
    </p>
  );
}
