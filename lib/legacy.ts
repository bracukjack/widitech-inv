"use client";

import type { Invoice, Settings } from "@/types/invoice";
import { normalizeInvoice, normalizeSettings, type Loose } from "@/lib/normalize";

/**
 * Earlier versions kept everything in this browser's localStorage. These
 * readers let a signed-in user move that data into their account once.
 */

const INVOICES_KEY = "widitech-invoices";
const SETTINGS_KEY = "widitech-settings";
const PROFILE_KEY = "widitech-profile";
const LOGO_KEY = "widitech-logo";
const ZUSTAND_SETTINGS_KEY = "settings-storage";
const IMPORTED_FLAG = "widitech-local-imported";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function readLegacyData(): { invoices: Invoice[]; settings: Settings | null } | null {
  try {
    if (localStorage.getItem(IMPORTED_FLAG)) return null;
  } catch {
    return null;
  }

  const rawInvoices = read<Loose[]>(INVOICES_KEY);
  const invoices = Array.isArray(rawInvoices)
    ? rawInvoices.filter((r) => r && r.isDeleted !== true).map(normalizeInvoice)
    : [];

  let settings: Settings | null = null;
  const current = read<Loose>(SETTINGS_KEY);
  if (current) {
    settings = normalizeSettings(current);
  } else {
    const profile = read<Loose>(PROFILE_KEY);
    const old = ((read<Loose>(ZUSTAND_SETTINGS_KEY)?.state as Loose)?.settings ?? null) as Loose | null;
    let logo = "";
    try {
      logo = localStorage.getItem(LOGO_KEY) ?? "";
    } catch {
      /* ignore */
    }
    if (profile || old || logo) {
      settings = normalizeSettings({
        profile: {
          ...(profile ?? {}),
          name: str(profile?.name) || str(old?.name),
          email: str(profile?.email) || str(old?.email),
          phone: str(profile?.phone) || str(old?.phone),
          address: str(profile?.address) || str(old?.address),
          bankName: str(profile?.bankName) || str(old?.bankName),
          bankAccount: str(profile?.bankAccount) || str(old?.bankAccount),
          bankAccountName: str(profile?.bankAccountName) || str(old?.bankAccountName),
          logo: logo || str(profile?.logo),
        },
        defaults: {
          currency: old?.defaultCurrency,
          taxRate: old?.defaultTaxRate,
          paymentTermsDays: old?.defaultPaymentTerms,
          prefix: old?.invoicePrefix,
        },
      });
    }
  }

  if (!invoices.length && !settings) return null;
  return { invoices, settings };
}

export function markLegacyImported(): void {
  try {
    localStorage.setItem(IMPORTED_FLAG, new Date().toISOString());
  } catch {
    /* ignore */
  }
}
