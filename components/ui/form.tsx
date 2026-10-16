"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-foreground/80">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Native <select> — uses the OS picker on phones, which is far easier to use than a custom popover. */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-input bg-background pr-9 pl-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:h-10 md:text-sm dark:bg-input/30",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("inline-flex rounded-xl bg-muted p-1", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-lg font-medium whitespace-nowrap transition-all",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
            value === o.value
              ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:bg-input dark:ring-white/10"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Number input that shows grouped digits ("1.500.000") when idle and the raw
 * number while typing. `decimals={0}` ignores dots/commas so Rupiah can be
 * typed with or without thousand separators.
 */
export function NumberInput({
  value,
  onChange,
  decimals = 2,
  locale = "id-ID",
  prefix,
  suffix,
  className,
  inputClassName,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "prefix"> & {
  value: number;
  onChange: (v: number) => void;
  decimals?: number;
  locale?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  inputClassName?: string;
}) {
  const [focused, setFocused] = React.useState(false);
  const [text, setText] = React.useState("");

  const formatted = value
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(value)
    : "";

  const parse = (raw: string) => {
    if (decimals === 0) {
      const digits = raw.replace(/\D/g, "");
      return { text: digits, value: digits ? parseInt(digits, 10) : 0 };
    }
    let cleaned = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot >= 0) cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
    const n = parseFloat(cleaned);
    return { text: cleaned, value: Number.isFinite(n) ? n : 0 };
  };

  return (
    <div
      className={cn(
        "flex h-11 w-full items-center rounded-xl border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 md:h-10 dark:bg-input/30",
        className
      )}
    >
      {prefix && <span className="pl-3 text-sm text-muted-foreground select-none">{prefix}</span>}
      <input
        {...props}
        type="text"
        inputMode={decimals === 0 ? "numeric" : "decimal"}
        autoComplete="off"
        value={focused ? text : formatted}
        onFocus={(e) => {
          setText(value ? String(value) : "");
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          const p = parse(e.target.value);
          setText(p.text);
          onChange(p.value);
        }}
        className={cn(
          "h-full w-full min-w-0 bg-transparent px-3 text-base tabular-nums outline-none placeholder:text-muted-foreground md:text-sm",
          inputClassName
        )}
      />
      {suffix && <span className="pr-3 text-sm text-muted-foreground select-none">{suffix}</span>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 text-sm font-medium"
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input dark:bg-muted"
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5"
          )}
        />
      </span>
      {label}
    </button>
  );
}
