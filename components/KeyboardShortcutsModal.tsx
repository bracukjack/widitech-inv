"use client";

import { formatShortcut, SHORTCUTS } from "@/lib/shortcuts";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  if (!open) return null;

  const navigation = [
    SHORTCUTS.GO_DASHBOARD,
    SHORTCUTS.GO_PROJECTS,
    SHORTCUTS.GO_CLIENTS,
    SHORTCUTS.GO_FINANCE,
    SHORTCUTS.GO_INVOICES,
    SHORTCUTS.GO_TIME,
  ];

  const actions = [
    SHORTCUTS.NEW_PROJECT,
    SHORTCUTS.NEW_CLIENT,
    SHORTCUTS.NEW_INVOICE,
    SHORTCUTS.SEARCH,
  ];

  const other = [
    SHORTCUTS.TOGGLE_VIEW,
    SHORTCUTS.SHOW_SHORTCUTS,
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Keyboard Shortcuts</h2>

        <div className="grid grid-cols-2 gap-8">
          {/* Navigation */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Navigation</h3>
            <div className="space-y-2">
              {navigation.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.description}</span>
                  <kbd className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{formatShortcut(s)}</kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Actions</h3>
            <div className="space-y-2">
              {actions.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.description}</span>
                  <kbd className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{formatShortcut(s)}</kbd>
                </div>
              ))}
            </div>

            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-5 mb-3">Other</h3>
            <div className="space-y-2">
              {other.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.description}</span>
                  <kbd className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{formatShortcut(s)}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-5 text-center">Press ? to close</p>
      </div>
    </div>
  );
}
