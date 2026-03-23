import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ProjectCategoryFull, SubCategory } from '@/types';

const defaultCategories: Omit<ProjectCategoryFull, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Website and web application development',
    color: '#3B82F6',
    icon: '🌐',
    defaultRate: 500000,
    rateUnit: 'per_hour',
    subCategories: [],
    isDefault: true,
    isDeleted: false,
    deletedAt: null,
    sortOrder: 0,
  },
  {
    name: 'Mobile App',
    slug: 'mobile-app',
    description: 'Mobile application development for iOS and Android',
    color: '#10B981',
    icon: '📱',
    defaultRate: 600000,
    rateUnit: 'per_hour',
    subCategories: [],
    isDefault: true,
    isDeleted: false,
    deletedAt: null,
    sortOrder: 1,
  },
  {
    name: 'Software Engineering',
    slug: 'software-engineering',
    description: 'Custom software and system development',
    color: '#8B5CF6',
    icon: '💻',
    defaultRate: 750000,
    rateUnit: 'per_hour',
    subCategories: [],
    isDefault: true,
    isDeleted: false,
    deletedAt: null,
    sortOrder: 2,
  },
  {
    name: 'Photography',
    slug: 'photography',
    description: 'Professional photography services',
    color: '#F59E0B',
    icon: '📷',
    defaultRate: 2000000,
    rateUnit: 'per_session',
    subCategories: [],
    isDefault: true,
    isDeleted: false,
    deletedAt: null,
    sortOrder: 3,
  },
  {
    name: 'Photo Editing',
    slug: 'photo-editing',
    description: 'Photo retouching and editing services',
    color: '#EF4444',
    icon: '🎨',
    defaultRate: 150000,
    rateUnit: 'per_hour',
    subCategories: [],
    isDefault: true,
    isDeleted: false,
    deletedAt: null,
    sortOrder: 4,
  },
];

function seedDefaults(): ProjectCategoryFull[] {
  const now = new Date().toISOString();
  return defaultCategories.map((cat) => ({
    ...cat,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  }));
}

interface CategoryStore {
  categories: ProjectCategoryFull[];

  // READ
  getCategories: () => ProjectCategoryFull[];
  getCategoryById: (id: string) => ProjectCategoryFull | undefined;
  getCategoryBySlug: (slug: string) => ProjectCategoryFull | undefined;

  // CREATE / UPDATE
  addCategory: (category: Omit<ProjectCategoryFull, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>) => void;
  updateCategory: (id: string, updates: Partial<ProjectCategoryFull>) => void;
  reorderCategories: (orderedIds: string[]) => void;

  // SUB-CATEGORIES
  addSubCategory: (categoryId: string, sub: Omit<SubCategory, 'id' | 'createdAt'>) => void;
  updateSubCategory: (categoryId: string, subId: string, updates: Partial<SubCategory>) => void;
  deleteSubCategory: (categoryId: string, subId: string) => void;

  // SOFT DELETE
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  getDeleted: () => ProjectCategoryFull[];
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      categories: seedDefaults(),

      // READ (exclude deleted)
      getCategories: () => get().categories.filter((c) => !c.isDeleted),
      getCategoryById: (id) => get().categories.find((c) => c.id === id && !c.isDeleted),
      getCategoryBySlug: (slug) => get().categories.find((c) => c.slug === slug && !c.isDeleted),

      // CREATE
      addCategory: (category) => {
        const now = new Date().toISOString();
        const newCategory: ProjectCategoryFull = {
          ...category,
          id: uuidv4(),
          isDeleted: false,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ categories: [...state.categories, newCategory] }));
      },

      // UPDATE
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ),
      })),

      reorderCategories: (orderedIds) => set((state) => ({
        categories: state.categories.map((c) => {
          const idx = orderedIds.indexOf(c.id);
          return idx !== -1 ? { ...c, sortOrder: idx, updatedAt: new Date().toISOString() } : c;
        }),
      })),

      // SUB-CATEGORIES
      addSubCategory: (categoryId, sub) => set((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                subCategories: [
                  ...c.subCategories,
                  { ...sub, id: uuidv4(), createdAt: new Date().toISOString() },
                ],
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      })),

      updateSubCategory: (categoryId, subId, updates) => set((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                subCategories: c.subCategories.map((s) =>
                  s.id === subId ? { ...s, ...updates } : s
                ),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      })),

      deleteSubCategory: (categoryId, subId) => set((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                subCategories: c.subCategories.filter((s) => s.id !== subId),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      })),

      // SOFT DELETE (blocked if isDefault)
      softDelete: (id) => {
        const cat = get().categories.find((c) => c.id === id);
        if (!cat || cat.isDefault) return;
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id
              ? { ...c, isDeleted: true, deletedAt: new Date().toISOString() }
              : c
          ),
        }));
      },

      restore: (id) => set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id
            ? { ...c, isDeleted: false, deletedAt: null, updatedAt: new Date().toISOString() }
            : c
        ),
      })),

      permanentDelete: (id) => {
        const cat = get().categories.find((c) => c.id === id);
        if (!cat || cat.isDefault) return;
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },

      getDeleted: () => get().categories.filter((c) => c.isDeleted),
    }),
    {
      name: 'category-storage',
      skipHydration: true,
    }
  )
);
