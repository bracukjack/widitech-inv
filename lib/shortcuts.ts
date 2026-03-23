export interface ShortcutDef {
  key: string;
  meta?: boolean;
  shift?: boolean;
  description: string;
}

export const SHORTCUTS: Record<string, ShortcutDef> = {
  SEARCH:          { key: 'k',  meta: true,  description: 'Open search' },
  NEW_PROJECT:     { key: 'p',  meta: true, shift: true, description: 'New project' },
  NEW_CLIENT:      { key: 'c',  meta: true, shift: true, description: 'New client' },
  NEW_INVOICE:     { key: 'i',  meta: true, shift: true, description: 'New invoice' },
  GO_DASHBOARD:    { key: '1',  meta: true,  description: 'Go to Dashboard' },
  GO_PROJECTS:     { key: '2',  meta: true,  description: 'Go to Projects' },
  GO_CLIENTS:      { key: '3',  meta: true,  description: 'Go to Clients' },
  GO_FINANCE:      { key: '4',  meta: true,  description: 'Go to Finance' },
  GO_INVOICES:     { key: '5',  meta: true,  description: 'Go to Invoices' },
  GO_TIME:         { key: '6',  meta: true,  description: 'Go to Time Tracker' },
  TOGGLE_VIEW:     { key: '\\', meta: true,  description: 'Toggle list/kanban' },
  SHOW_SHORTCUTS:  { key: '?',                description: 'Show keyboard shortcuts' },
};

export function formatShortcut(def: ShortcutDef): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];
  if (def.meta) parts.push(isMac ? '⌘' : 'Ctrl');
  if (def.shift) parts.push(isMac ? '⇧' : 'Shift');
  parts.push(def.key.toUpperCase());
  return parts.join(isMac ? '' : '+');
}
