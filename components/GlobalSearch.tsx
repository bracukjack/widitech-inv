"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/lib/searchStore";
import { useProjectStore } from "@/lib/projectStore";
import { useClientStore } from "@/lib/clientStore";
import { getInvoices } from "@/lib/invoiceStore";
import { formatIDR } from "@/lib/constants";
import { STATUS_CONFIG } from "@/lib/constants";
import {
  Search,
  SearchX,
  FolderKanban,
  Users,
  FileText,
  Plus,
  Clock,
  X,
} from "lucide-react";
import { Invoice } from "@/types/invoice";

interface SearchResult {
  id: string;
  type: 'project' | 'client' | 'invoice' | 'action';
  title: string;
  subtitle?: string;
  href: string;
  status?: string;
  statusColor?: string;
}

export default function GlobalSearch() {
  const { isOpen, query, close, setQuery } = useSearchStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const projects = useProjectStore((s) => s.projects).filter((p) => !p.isDeleted);
  const clients = useClientStore((s) => s.clients).filter((c) => !c.isDeleted);

  useEffect(() => {
    if (isOpen) {
      setInvoices(getInvoices());
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const getResults = useCallback((): SearchResult[] => {
    const results: SearchResult[] = [];
    const q = query.toLowerCase().trim();

    if (q) {
      // Projects
      const matchedProjects = projects
        .filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
        .slice(0, 5);
      matchedProjects.forEach((p) => {
        const status = STATUS_CONFIG[p.status];
        results.push({
          id: p.id,
          type: 'project',
          title: p.name,
          subtitle: status.label,
          href: `/projects/${p.id}`,
          status: status.label,
          statusColor: status.text,
        });
      });

      // Clients
      const matchedClients = clients
        .filter((c) => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
        .slice(0, 3);
      matchedClients.forEach((c) => {
        results.push({
          id: c.id,
          type: 'client',
          title: c.name,
          subtitle: c.company || c.email || '',
          href: `/clients/${c.id}`,
        });
      });

      // Invoices
      const matchedInvoices = invoices
        .filter((i) => !i.isDeleted)
        .filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.clientName.toLowerCase().includes(q))
        .slice(0, 3);
      matchedInvoices.forEach((i) => {
        results.push({
          id: i.id,
          type: 'invoice',
          title: i.invoiceNumber,
          subtitle: `${i.clientName} · ${i.status}`,
          href: `/invoice/${i.id}`,
        });
      });
    }

    // Quick actions (always shown)
    results.push(
      { id: 'action-project', type: 'action', title: 'New Project', href: '/projects', subtitle: 'Create a new project' },
      { id: 'action-client', type: 'action', title: 'New Client', href: '/clients', subtitle: 'Add a new client' },
      { id: 'action-invoice', type: 'action', title: 'New Invoice', href: '/invoice/new', subtitle: 'Generate an invoice' },
      { id: 'action-time', type: 'action', title: 'Log Time', href: '/time-tracker', subtitle: 'Track your work hours' },
    );

    return results;
  }, [query, projects, clients, invoices]);

  const results = getResults();

  const handleSelect = (result: SearchResult) => {
    close();
    router.push(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'project': return <FolderKanban className="size-4 text-muted-foreground" />;
      case 'client': return <Users className="size-4 text-muted-foreground" />;
      case 'invoice': return <FileText className="size-4 text-muted-foreground" />;
      case 'action': return <Plus className="size-4 text-muted-foreground" />;
      default: return null;
    }
  };

  // Group results by type for section headers
  const groupLabels: Record<string, string> = {
    project: 'Projects',
    client: 'Clients',
    invoice: 'Invoices',
    action: 'Quick Actions',
  };

  let currentGroup = '';
  let globalIdx = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, clients, invoices..."
            className="flex-1 h-12 px-3 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button onClick={close} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="size-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-2">
          {query && results.filter(r => r.type !== 'action').length === 0 && (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <SearchX className="size-8 mb-2 text-muted-foreground/40" />
              <p className="text-sm font-medium">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1">Try different keywords or check the spelling.</p>
            </div>
          )}

          {results.map((result, idx) => {
            globalIdx++;
            let showHeader = false;
            if (result.type !== currentGroup) {
              currentGroup = result.type;
              showHeader = true;
              // Don't show search result section headers if no query and type isn't action
              if (!query && result.type !== 'action') showHeader = false;
            }
            // Skip non-action results if no query
            if (!query && result.type !== 'action') return null;

            return (
              <div key={result.id}>
                {showHeader && (
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                      {groupLabels[result.type]}
                    </span>
                  </div>
                )}
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-left transition-colors ${
                    idx === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                  style={{ width: 'calc(100% - 8px)' }}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  {getIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                  {result.status && (
                    <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-muted shrink-0" style={{ color: result.statusColor }}>
                      {result.status}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
