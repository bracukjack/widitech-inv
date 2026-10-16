"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResetPasswordDialog from "@/components/admin/ResetPasswordDialog";
import { setUserDisabledAction } from "@/lib/actions/admin";

/** Reset-password and enable/disable buttons for the user detail page. */
export default function UserActions({ user }: { user: { id: string; email: string; name: string; disabled: boolean } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      const res = await setUserDisabledAction(user.id, !user.disabled);
      if (!res.ok) return void toast.error(res.error);
      toast.success(user.disabled ? "Akun diaktifkan" : "Akun dinonaktifkan dan dikeluarkan dari semua perangkat");
      router.refresh();
    });

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setOpen(true)}>
        <KeyRound className="size-4" /> Reset password
      </Button>
      <Button variant="outline" onClick={toggle} disabled={pending} className={user.disabled ? "" : "text-destructive hover:text-destructive"}>
        {user.disabled ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
        {user.disabled ? "Aktifkan akun" : "Nonaktifkan akun"}
      </Button>
      {open && <ResetPasswordDialog user={user} onClose={() => setOpen(false)} />}
    </div>
  );
}
