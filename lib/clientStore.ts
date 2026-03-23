import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Client, MeetingNote } from '@/types';
import { migrateNestedSoftDelete } from '@/lib/storage';

interface ClientStore {
  clients: Client[];

  // CREATE
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => Client;

  // READ
  getClients: () => Client[];
  getClientById: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  getClientsByTag: (tag: string) => Client[];

  // UPDATE
  updateClient: (id: string, updates: Partial<Client>) => void;
  updateRating: (id: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;

  // MEETING NOTES CRUD
  addMeetingNote: (clientId: string, note: Omit<MeetingNote, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;
  updateNote: (clientId: string, noteId: string, content: string) => void;
  deleteMeetingNote: (clientId: string, noteId: string) => void;
  softDeleteNote: (clientId: string, noteId: string) => void;
  restoreNote: (clientId: string, noteId: string) => void;
  permanentDeleteNote: (clientId: string, noteId: string) => void;
  getActiveNotes: (clientId: string) => MeetingNote[];

  // SOFT DELETE
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  deleteClient: (id: string) => void; // backward compat
  getDeleted: () => Client[];
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],

      addClient: (client) => {
        const newClient: Client = {
          ...client,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          isDeleted: false,
          deletedAt: null,
        };
        set((state) => ({ clients: [...state.clients, newClient] }));
        return newClient;
      },

      // READ
      getClients: () => get().clients.filter((c) => !c.isDeleted),
      getClientById: (id) => get().clients.find((c) => c.id === id && !c.isDeleted),
      searchClients: (query) => {
        const q = query.toLowerCase();
        return get().clients.filter((c) => !c.isDeleted && (c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)));
      },
      getClientsByTag: (tag) => get().clients.filter((c) => !c.isDeleted && c.tags.includes(tag)),

      // UPDATE
      updateClient: (id, updates) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),
      updateRating: (id, rating) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, rating } : c
        ),
      })),
      addTag: (id, tag) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c
        ),
      })),
      removeTag: (id, tag) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, tags: c.tags.filter((t) => t !== tag) } : c
        ),
      })),

      // MEETING NOTES
      addMeetingNote: (clientId, note) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                notes: [
                  ...c.notes,
                  { ...note, id: uuidv4(), createdAt: new Date().toISOString(), isDeleted: false, deletedAt: null },
                ],
              }
            : c
        ),
      })),

      updateNote: (clientId, noteId, content) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === clientId
            ? { ...c, notes: c.notes.map((n) => n.id === noteId ? { ...n, content } : n) }
            : c
        ),
      })),

      deleteMeetingNote: (clientId, noteId) => {
        get().softDeleteNote(clientId, noteId);
      },

      softDeleteNote: (clientId, noteId) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === clientId
            ? { ...c, notes: c.notes.map((n) => n.id === noteId ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() } : n) }
            : c
        ),
      })),

      restoreNote: (clientId, noteId) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === clientId
            ? { ...c, notes: c.notes.map((n) => n.id === noteId ? { ...n, isDeleted: false, deletedAt: null } : n) }
            : c
        ),
      })),

      permanentDeleteNote: (clientId, noteId) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === clientId
            ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) }
            : c
        ),
      })),

      getActiveNotes: (clientId) => {
        const client = get().clients.find((c) => c.id === clientId);
        return client ? client.notes.filter((n) => !n.isDeleted) : [];
      },

      // SOFT DELETE
      softDelete: (id) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, isDeleted: true, deletedAt: new Date().toISOString() } : c
        ),
      })),
      restore: (id) => set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? { ...c, isDeleted: false, deletedAt: null } : c
        ),
      })),
      permanentDelete: (id) => set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
      })),
      deleteClient: (id) => { get().softDelete(id); },
      getDeleted: () => get().clients.filter((c) => c.isDeleted),
    }),
    {
      name: 'client-storage',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.clients = migrateNestedSoftDelete(state.clients, 'notes');
        }
      },
    }
  )
);
