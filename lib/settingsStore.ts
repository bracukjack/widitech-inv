import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings } from '@/types';

const defaultSettings: UserSettings = {
  name: '',
  businessName: '',
  email: '',
  phone: '',
  address: '',
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
  defaultTaxRate: 11,
  defaultCurrency: 'IDR',
  defaultPaymentTerms: 14,
  invoicePrefix: 'INV',
  hasCompletedOnboarding: false,
};

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  setOnboardingComplete: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),
      setOnboardingComplete: () => set((state) => ({
        settings: { ...state.settings, hasCompletedOnboarding: true },
      })),
    }),
    {
      name: 'settings-storage',
      skipHydration: true,
    }
  )
);
