import { Currency } from "@/types/invoice";

export function formatCurrency(amount: number, currency: Currency): string {
  switch (currency) {
    case "IDR":
      return `Rp ${amount.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case "USD":
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "EUR":
      return `€${amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    default:
      return amount.toString();
  }
}
