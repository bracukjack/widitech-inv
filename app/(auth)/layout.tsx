import ThemeToggle from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="mb-6 flex items-center gap-2.5 font-semibold tracking-tight">
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-base font-bold text-primary-foreground">W</span>
        <span className="text-lg">Widitech Invoice</span>
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">{children}</div>
    </div>
  );
}
