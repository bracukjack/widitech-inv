"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getProfile, saveProfile, getLogo, saveLogo, removeLogo } from "@/lib/invoiceStore";
import { FreelancerProfile } from "@/types/invoice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2, Upload, X, User } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string(),
  address: z.string(),
  bankAccount: z.string(),
  bankName: z.string(),
});

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logo, setLogo] = useState<string>("");
  const [logoError, setLogoError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Omit<FreelancerProfile, "logo">>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      bankAccount: "",
      bankName: "",
    },
  });

  const watchedName = watch("name");

  useEffect(() => {
    const profile = getProfile();
    reset(profile);
    setLogo(getLogo());
    setMounted(true);
  }, [reset]);

  const processFile = useCallback((file: File) => {
    setLogoError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLogoError("Only PNG, JPG, or SVG files are accepted.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("File must be smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setLogo(base64);
      saveLogo(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      if (e.target) e.target.value = "";
    },
    [processFile]
  );

  const handleRemoveLogo = useCallback(() => {
    setLogo("");
    removeLogo();
  }, []);

  const onSubmit = (data: Omit<FreelancerProfile, "logo">) => {
    saveProfile({ ...data, logo });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!mounted) return null;

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Save your freelancer profile. This info will auto-fill on every new
          invoice.
        </p>
      </div>

      {/* Logo Upload */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Logo
        </h2>
        <div className="flex items-start gap-6">
          {/* Preview */}
          <div className="shrink-0">
            {logo ? (
              <div className="relative">
                <img
                  src={logo}
                  alt="Logo"
                  className="size-20 rounded-xl object-cover border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  className="absolute -top-2 -right-2 rounded-full size-6"
                  onClick={handleRemoveLogo}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <div className="size-20 rounded-xl bg-primary/10 flex items-center justify-center border border-border">
                {watchedName ? (
                  <span className="text-xl font-bold text-primary">
                    {getInitials(watchedName)}
                  </span>
                ) : (
                  <User className="size-8 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Drop zone */}
          <div className="flex-1">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="size-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag & drop or{" "}
                <span className="text-primary font-medium">click to browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, or SVG · Max 2MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            {logoError && (
              <p className="text-xs text-destructive mt-2">{logoError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Profile Information
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Your full name"
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+62 xxx xxx xxxx"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Street, City, Postal Code"
              />
            </div>
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                {...register("bankName")}
                placeholder="e.g. Bank Central Asia"
              />
            </div>
            <div>
              <Label htmlFor="bankAccount">Bank Account Number</Label>
              <Input
                id="bankAccount"
                {...register("bankAccount")}
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit">
              <Save className="size-4 mr-1.5" />
              Save Profile
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                Saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
