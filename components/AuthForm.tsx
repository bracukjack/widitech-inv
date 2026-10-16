"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/form";
import { loginAction, registerAction, type AuthFormState } from "@/lib/actions/auth";

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    mode === "login" ? loginAction : registerAction,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="space-y-4">
      <div className="mb-2">
        <h1 className="text-xl font-semibold tracking-tight">{isLogin ? "Masuk" : "Buat akun"}</h1>
        <p className="text-sm text-muted-foreground">
          {isLogin ? "Masuk untuk mengelola invoice Anda." : "Gratis. Invoice tersimpan aman di akun Anda."}
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      {next && <input type="hidden" name="next" value={next} />}

      {!isLogin && (
        <Field label="Nama" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" defaultValue={state.name} required placeholder="Nama Anda / bisnis" />
        </Field>
      )}
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state.email}
          required
          placeholder="anda@email.com"
          autoFocus
        />
      </Field>
      <Field label="Password" htmlFor="password" hint={isLogin ? undefined : "Minimal 8 karakter"}>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : 8}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {isLogin ? "Masuk" : "Daftar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
        <Link
          href={`${isLogin ? "/register" : "/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-primary hover:underline"
        >
          {isLogin ? "Daftar" : "Masuk"}
        </Link>
      </p>
    </form>
  );
}
