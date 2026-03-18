"use client";

import { THEMES, THEME_IDS, type ThemeId } from "@/lib/themes";

interface ThemePickerProps {
  value: string;
  onChange: (theme: string) => void;
}

export default function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2">
      {THEME_IDS.map((id) => {
        const t = THEMES[id];
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              isActive
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <span
              className="size-3 rounded-full shrink-0 border border-white/30"
              style={{ background: t.accentColor }}
            />
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
