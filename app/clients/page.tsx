"use client";

import { useEffect, useState } from "react";
import { useClientStore } from "@/lib/clientStore";
import { useProjectStore } from "@/lib/projectStore";
import { seedAllData } from "@/lib/seedData";
import { formatIDR } from "@/lib/constants";
import { Client } from "@/types";
import { ClientFormData } from "@/lib/schemas";
import { Star, Search, Users, Plus, Trash2, Pencil, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClientForm from "@/components/ClientForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import ClientListSkeleton from "@/components/skeletons/ClientListSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import { showCreated, showUpdated, showDeleted, showError } from "@/lib/toasts";

export default function ClientsPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const clients = useClientStore((s) => s.clients).filter((c) => !c.isDeleted);
  const projects = useProjectStore((s) => s.projects).filter((p) => !p.isDeleted);
  const addClient = useClientStore((s) => s.addClient);
  const updateClient = useClientStore((s) => s.updateClient);
  const softDelete = useClientStore((s) => s.softDelete);
  const restore = useClientStore((s) => s.restore);

  useEffect(() => {
    seedAllData();
    useClientStore.persist.rehydrate();
    useProjectStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return <ClientListSkeleton />;

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleCreate = (data: ClientFormData) => {
    addClient({ ...data, notes: [] });
    showCreated("Client");
  };

  const handleEdit = (data: ClientFormData) => {
    if (!editClient) return;
    updateClient(editClient.id, data);
    showUpdated("Client");
    setEditClient(null);
  };

  const handleDelete = (client: Client) => {
    const activeProjects = projects.filter((p) => p.clientId === client.id && !['done', 'cancelled'].includes(p.status));
    if (activeProjects.length > 0) {
      showError(`Cannot delete client with ${activeProjects.length} active project(s). Complete or cancel them first.`);
      setDeleteTarget(null);
      return;
    }
    softDelete(client.id);
    showDeleted("Client", () => restore(client.id));
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 lg:p-8 w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{clients.length} clients</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="size-4 mr-1" /> New Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start managing relationships"
          action={{ label: "Add Client", onClick: () => setShowCreateForm(true) }}
        />
      ) : (<>
      <div className="relative w-64">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="size-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No clients found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Add your first client to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => {
            const clientProjects = projects.filter((p) => p.clientId === client.id);
            const activeCount = clientProjects.filter((p) => !['done', 'cancelled'].includes(p.status)).length;
            const totalRevenue = clientProjects
              .filter((p) => p.finalPaid || p.dpPaid)
              .reduce((sum, p) => sum + (p.dpPaid ? p.dpAmount : 0) + (p.finalPaid ? p.contractValue - p.dpAmount : 0), 0);

            return (
              <div key={client.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors h-full relative group">
                <Link href={`/clients/${client.id}`} className="block">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{client.name}</h3>
                      {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-3 ${i < client.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {client.tags.map((tag) => (
                      <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{activeCount} active project{activeCount !== 1 ? 's' : ''}</span>
                    <span className="font-mono font-medium text-foreground">{formatIDR(totalRevenue)}</span>
                  </div>
                </Link>
                {/* Action menu */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActionMenu(actionMenu === client.id ? null : client.id); }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                    {actionMenu === client.id && (
                      <div className="absolute right-0 top-7 z-20 bg-card border border-border rounded-lg shadow-lg py-1 w-32">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditClient(client); setActionMenu(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <Pencil className="size-3.5" /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(client); setActionMenu(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>)}

      {/* Create Client Form */}
      <ClientForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Edit Client Form */}
      {editClient && (
        <ClientForm
          open={!!editClient}
          onOpenChange={(open) => { if (!open) setEditClient(null); }}
          onSubmit={handleEdit}
          defaultValues={{
            name: editClient.name,
            company: editClient.company,
            email: editClient.email,
            phone: editClient.phone,
            instagram: editClient.instagram,
            address: editClient.address,
            rating: editClient.rating,
            tags: editClient.tags,
          }}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This client will be moved to trash. You can restore it later."
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  );
}
