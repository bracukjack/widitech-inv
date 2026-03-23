import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Expense, ManualIncome } from '@/types';
import { migrateSoftDelete } from '@/lib/storage';

interface FinanceStore {
  expenses: Expense[];
  manualIncomes: ManualIncome[];

  // EXPENSE CRUD
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  softDeleteExpense: (id: string) => void;
  restoreExpense: (id: string) => void;
  permanentDeleteExpense: (id: string) => void;
  getExpenses: () => Expense[];
  getDeletedExpenses: () => Expense[];

  // MANUAL INCOME CRUD
  addManualIncome: (data: Omit<ManualIncome, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;
  updateManualIncome: (id: string, updates: Partial<ManualIncome>) => void;
  softDeleteManualIncome: (id: string) => void;
  restoreManualIncome: (id: string) => void;
  permanentDeleteManualIncome: (id: string) => void;
  getManualIncomes: () => ManualIncome[];
  getDeletedManualIncomes: () => ManualIncome[];
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      expenses: [],
      manualIncomes: [],

      // EXPENSE
      addExpense: (expense) => set((state) => ({
        expenses: [
          ...state.expenses,
          { ...expense, id: uuidv4(), createdAt: new Date().toISOString(), isDeleted: false, deletedAt: null },
        ],
      })),

      updateExpense: (id, updates) => set((state) => ({
        expenses: state.expenses.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      })),

      deleteExpense: (id) => { get().softDeleteExpense(id); },

      softDeleteExpense: (id) => set((state) => ({
        expenses: state.expenses.map((e) =>
          e.id === id ? { ...e, isDeleted: true, deletedAt: new Date().toISOString() } : e
        ),
      })),

      restoreExpense: (id) => set((state) => ({
        expenses: state.expenses.map((e) =>
          e.id === id ? { ...e, isDeleted: false, deletedAt: null } : e
        ),
      })),

      permanentDeleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      })),

      getExpenses: () => get().expenses.filter((e) => !e.isDeleted),
      getDeletedExpenses: () => get().expenses.filter((e) => e.isDeleted),

      // MANUAL INCOME
      addManualIncome: (data) => set((state) => ({
        manualIncomes: [
          ...state.manualIncomes,
          { ...data, id: uuidv4(), createdAt: new Date().toISOString(), isDeleted: false, deletedAt: null },
        ],
      })),

      updateManualIncome: (id, updates) => set((state) => ({
        manualIncomes: state.manualIncomes.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      })),

      softDeleteManualIncome: (id) => set((state) => ({
        manualIncomes: state.manualIncomes.map((m) =>
          m.id === id ? { ...m, isDeleted: true, deletedAt: new Date().toISOString() } : m
        ),
      })),

      restoreManualIncome: (id) => set((state) => ({
        manualIncomes: state.manualIncomes.map((m) =>
          m.id === id ? { ...m, isDeleted: false, deletedAt: null } : m
        ),
      })),

      permanentDeleteManualIncome: (id) => set((state) => ({
        manualIncomes: state.manualIncomes.filter((m) => m.id !== id),
      })),

      getManualIncomes: () => get().manualIncomes.filter((m) => !m.isDeleted),
      getDeletedManualIncomes: () => get().manualIncomes.filter((m) => m.isDeleted),
    }),
    {
      name: 'finance-storage',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.expenses = migrateSoftDelete(state.expenses);
          state.manualIncomes = migrateSoftDelete(state.manualIncomes || []);
        }
      },
    }
  )
);
