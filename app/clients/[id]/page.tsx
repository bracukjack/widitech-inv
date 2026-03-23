"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useClientStore } from "@/lib/clientStore";
import { useProjectStore } from "@/lib/projectStore";
import { seedAllData } from "@/lib/seedData";
import { STATUS_CONFIG, formatIDR } from "@/lib/constants";
import { format } from "date-fns";
import {
  ArrowLeft,
  Star,
  Mail,
  Phone,
  Instagram,
  MapPin,
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { showCreated, showDeleted } from "@/lib/toasts";
import Breadcrumb from "@/components/layout/Breadcrumb";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [mounted, setMounted] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteDate, setNoteDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const clients = useClientStore((s) => s.clients);
  const updateClient = useClientStore((s) => s.updateClient);
  const addMeetingNote = useClientStore((s) => s.addMeetingNote);
  const softDeleteNote = useClientStore((s) => s.softDeleteNote);
  const restoreNote = useClientStore((s) => s.restoreNote);
  const projects = useProjectStore((s) => s.projects);

  useEffect(() => {
    seedAllData();
    useClientStore.persist.rehydrate();
    useProjectStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const client = clients.find((c) => c.id === id);
  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Client not found</p>
        <Link href="/clients"><Button variant="outline" className="mt-4">Back to Clients</Button></Link>
      </div>
    );
  }

  const clientProjects = projects.filter((p) => p.clientId === client.id && !p.isDeleted);
  const totalRevenue = clientProjects
    .filter((p) => p.finalPaid || p.dpPaid)
    .reduce((sum, p) => sum + (p.dpPaid ? p.dpAmount : 0) + (p.finalPaid ? p.contractValue - p.dpAmount : 0), 0);
  const totalInvoiced = clientProjects.reduce((sum, p) => sum + p.contractValue, 0);
  const outstanding = totalInvoiced - totalRevenue;

  const handleRating = (rating: 1 | 2 | 3 | 4 | 5) => {
    updateClient(client.id, { rating });
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    addMeetingNote(client.id, { date: noteDate, content: noteContent.trim() });
    setNoteContent("");
    showCreated("Meeting note");
  };

  const activeNotes = client.notes.filter((n) => !n.isDeleted);

  return (
    <div className="p-6 lg:p-8 w-full mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Clients", href: "/clients" },
        { label: client.name },
      ]} />

      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Clients
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{client.name}</h1>
            {client.company && <p className="text-muted-foreground mt-0.5">{client.company}</p>}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => handleRating((i + 1) as 1 | 2 | 3 | 4 | 5)}>
                <Star className={`size-5 cursor-pointer transition-colors ${i < client.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 flex-wrap text-sm text-muted-foreground">
          {client.email && <span className="flex items-center gap-1.5"><Mail className="size-3.5" />{client.email}</span>}
          {client.phone && <span className="flex items-center gap-1.5"><Phone className="size-3.5" />{client.phone}</span>}
          {client.instagram && <span className="flex items-center gap-1.5"><Instagram className="size-3.5" />{client.instagram}</span>}
          {client.address && <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{client.address}</span>}
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {client.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{tag}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Projects + Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project History */}
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Project History</h2>
            </div>
            {clientProjects.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No projects with this client</div>
            ) : (
              <div className="divide-y divide-border">
                {clientProjects.map((project) => {
                  const status = STATUS_CONFIG[project.status];
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[12px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg, color: status.text }}>
                            {status.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{format(new Date(project.startDate), 'MMM yyyy')}</span>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-medium">{formatIDR(project.contractValue)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Meeting Notes */}
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Meeting Notes</h2>
            </div>
            <div className="p-4 border-b border-border space-y-2">
              <div className="flex gap-2">
                <Input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} className="w-40" />
                <Button size="sm" onClick={handleAddNote} disabled={!noteContent.trim()}>
                  <Plus className="size-3.5 mr-1" /> Add Note
                </Button>
              </div>
              <Textarea
                placeholder="Write a meeting note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={2}
              />
            </div>
            {activeNotes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <MessageSquare className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                No meeting notes yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {[...activeNotes].reverse().map((note) => (
                  <div key={note.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">{format(new Date(note.date), 'MMM dd, yyyy')}</p>
                      <p className="text-sm text-foreground">{note.content}</p>
                    </div>
                    <button
                      onClick={() => { softDeleteNote(client.id, note.id); showDeleted('Meeting note', () => restoreNote(client.id, note.id)); }}
                      className="text-muted-foreground hover:text-red-600 transition-colors shrink-0 mt-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Financial Summary */}
        <div className="bg-card border border-border rounded-xl p-5 h-fit space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Revenue</span>
              <span className="font-mono font-medium text-green-600">{formatIDR(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Invoiced</span>
              <span className="font-mono font-medium">{formatIDR(totalInvoiced)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="font-medium">Outstanding</span>
              <span className={`font-mono font-bold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatIDR(outstanding)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
