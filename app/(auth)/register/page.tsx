import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Daftar — Widitech Invoice" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="register" />;
}
