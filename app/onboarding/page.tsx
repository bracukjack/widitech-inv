'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/settingsStore';
import { useCategoryStore } from '@/lib/categoryStore';
import { saveProfile } from '@/lib/invoiceStore';
import { seedAllData } from '@/lib/seedData';
import { cn } from '@/lib/utils';
import {
  User,
  Building2,
  CreditCard,
  Briefcase,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import type { RateUnit } from '@/types';

const RATE_UNIT_OPTIONS: { value: RateUnit; label: string }[] = [
  { value: 'per_hour', label: '/hour' },
  { value: 'per_session', label: '/session' },
  { value: 'per_project', label: '/project' },
  { value: 'per_day', label: '/day' },
];

interface CategoryRow {
  id: string;
  name: string;
  rate: number;
  rateUnit: RateUnit;
  isDefault: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { settings, updateSettings, setOnboardingComplete } = useSettingsStore();

  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Step 1 fields
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');

  // Step 2 fields
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [taxRate, setTaxRate] = useState(11);
  const [paymentTerms, setPaymentTerms] = useState(14);
  const [invoicePrefix, setInvoicePrefix] = useState('INV');

  // Step 3
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  useEffect(() => {
    useSettingsStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    setMounted(true);
    // Load default categories from store
    const cats = useCategoryStore.getState().getCategories();
    setCategories(
      cats.map((c) => ({
        id: c.id,
        name: c.name,
        rate: c.defaultRate,
        rateUnit: c.rateUnit,
        isDefault: c.isDefault,
      }))
    );
  }, []);

  // Redirect if already onboarded
  useEffect(() => {
    if (mounted && settings.hasCompletedOnboarding) {
      router.replace('/');
    }
  }, [mounted, settings.hasCompletedOnboarding, router]);

  const step1Valid = name.trim() && businessName.trim() && email.trim() && currency;
  const step2Valid = bankName.trim() && bankAccount.trim() && bankAccountName.trim();

  function handleAddCategory() {
    setCategories((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        rate: 0,
        rateUnit: 'per_hour' as RateUnit,
        isDefault: false,
      },
    ]);
  }

  function handleRemoveCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function updateCategoryRow(id: string, updates: Partial<CategoryRow>) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  function handleFinish() {
    // 1. Save settings
    updateSettings({
      name,
      businessName,
      email,
      phone,
      address,
      defaultCurrency: currency,
      bankName,
      bankAccount,
      bankAccountName,
      defaultTaxRate: taxRate,
      defaultPaymentTerms: paymentTerms,
      invoicePrefix,
    });

    // 2. Mark onboarding complete
    setOnboardingComplete();

    // 3. Save profile to invoiceStore
    saveProfile({
      name,
      email,
      phone,
      address,
      bankAccount,
      bankName,
      bankAccountName,
      logo: '',
    });

    // 4. Update categories in store
    const store = useCategoryStore.getState();
    categories.forEach((cat) => {
      const existing = store.getCategoryById(cat.id);
      if (existing) {
        store.updateCategory(cat.id, {
          name: cat.name,
          defaultRate: cat.rate,
          rateUnit: cat.rateUnit,
        });
      } else if (cat.name.trim()) {
        store.addCategory({
          name: cat.name,
          slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
          color: '#6B7280',
          icon: '📂',
          defaultRate: cat.rate,
          rateUnit: cat.rateUnit,
          subCategories: [],
          isDefault: false,
          sortOrder: categories.length,
        });
      }
    });

    // 5. Seed sample data
    seedAllData();

    // 6. Redirect
    router.push('/');
  }

  function handleSkip() {
    setOnboardingComplete();
    seedAllData();
    router.push('/');
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[520px]">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-colors',
                s <= step ? 'bg-primary' : 'bg-muted-foreground/25'
              )}
            />
          ))}
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          {/* Step 1 — Business Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome to your Business OS
                </h1>
                <p className="text-sm text-muted-foreground">
                  Let&apos;s set up your profile so invoices and reports are ready to go.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Your name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Business name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Acme Studio"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-3456-7890"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="Street address, city, country"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Default currency <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'IDR' | 'USD')}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="IDR">IDR — Indonesian Rupiah</option>
                    <option value="USD">USD — US Dollar</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip setup
                </button>
                <button
                  type="button"
                  disabled={!step1Valid}
                  onClick={() => setStep(2)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
                    step1Valid
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Invoice & Payment Setup */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Invoice settings
                </h1>
                <p className="text-sm text-muted-foreground">
                  These will auto-fill on every invoice you create.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Bank name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="BCA, Mandiri, BNI..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Account number <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="1234567890"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Account holder name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Default tax rate (%)
                    </label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      min={0}
                      max={100}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Payment terms (days)
                    </label>
                    <input
                      type="number"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(Number(e.target.value))}
                      min={0}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Invoice prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={!step2Valid}
                  onClick={() => setStep(3)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
                    step2Valid
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Work Categories */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Your work categories
                </h1>
                <p className="text-sm text-muted-foreground">
                  Add the types of work you do and your default rates.
                </p>
              </div>

              <div className="space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2 rounded-lg border bg-background p-3"
                  >
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) =>
                        updateCategoryRow(cat.id, { name: e.target.value })
                      }
                      placeholder="Category name"
                      className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                    />
                    <input
                      type="number"
                      value={cat.rate || ''}
                      onChange={(e) =>
                        updateCategoryRow(cat.id, {
                          rate: Number(e.target.value),
                        })
                      }
                      placeholder="Rate"
                      min={0}
                      className="w-28 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                    />
                    <select
                      value={cat.rateUnit}
                      onChange={(e) =>
                        updateCategoryRow(cat.id, {
                          rateUnit: e.target.value as RateUnit,
                        })
                      }
                      className="rounded-md border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {RATE_UNIT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {!cat.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddCategory}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finish setup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skip link on steps 2 & 3 */}
        {step > 1 && (
          <p className="text-center mt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip setup
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
