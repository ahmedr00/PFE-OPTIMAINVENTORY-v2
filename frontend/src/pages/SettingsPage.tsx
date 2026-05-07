import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { settingsService } from "@/api/services";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { initials, formatRelativeDate } from "@/lib/format";
import { useThemeStore } from "@/store/theme";
import { useUIStore } from "@/store/ui";
import { displayRole, isAdminRole, isCounterRole } from "@/utils/roles";
import type { User } from "@/types/domain";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(4, "Required"),
    newPassword: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string().min(6, "Min 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const accountTypeFor = (user: User) => {
  if (user.role === "SuperAdmin") return "Platform administrator";
  if (isAdminRole(user.role)) return "Company admin";
  if (isCounterRole(user.role)) return "Inventory counter";
  return "Workspace user";
};

export function SettingsPage({ user }: { user: User }) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace preferences"
        description="Manage your profile, account security, theme, and company workspace."
      />

      <Card className="overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 ai-gradient" />
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initials(user.name, user.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold tracking-tight">{user.name || "User"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={user.role === "SuperAdmin" ? "ai" : "primary"}>
                <ShieldCheck className="size-3" /> {displayRole(user.role)}
              </Badge>
              <Badge tone="outline">{accountTypeFor(user)}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Joined
              </p>
              <p className="text-sm font-semibold tabular">{formatRelativeDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Last login
              </p>
              <p className="text-sm font-semibold tabular">{formatRelativeDate(user.lastLogin)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="size-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="size-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="size-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="size-4" /> Company
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={user} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceTab />
        </TabsContent>
        <TabsContent value="company">
          <CompanyTab user={user} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function ProfileTab({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Read-only profile details synced from your account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <ProfileField icon={<UserIcon className="size-3.5" />} label="Display name" value={user.name || "—"} />
        <ProfileField icon={<Mail className="size-3.5" />} label="Email" value={user.email} />
        <ProfileField icon={<ShieldCheck className="size-3.5" />} label="Role" value={displayRole(user.role)} />
        <ProfileField icon={<Calendar className="size-3.5" />} label="Member since" value={formatRelativeDate(user.createdAt)} />
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const change = useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) =>
      settingsService.changePassword(values),
    onSuccess: (data) => {
      toast.success(data.message || "Password updated");
      form.reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not change password"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Pick a strong password you don't use anywhere else.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit((values) =>
            change.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
          )}
          className="grid gap-4 sm:grid-cols-2"
        >
          <PasswordField
            label="Current password"
            register={form.register("currentPassword")}
            error={form.formState.errors.currentPassword?.message}
            visible={showCurrent}
            onToggle={() => setShowCurrent((p) => !p)}
          />
          <PasswordField
            label="New password"
            register={form.register("newPassword")}
            error={form.formState.errors.newPassword?.message}
            visible={showNew}
            onToggle={() => setShowNew((p) => !p)}
          />
          <PasswordField
            label="Confirm new password"
            register={form.register("confirmPassword")}
            error={form.formState.errors.confirmPassword?.message}
            visible={showNew}
            onToggle={() => setShowNew((p) => !p)}
          />
          <div className="sm:col-span-2 flex items-center justify-end">
            <Button type="submit" variant="ai" disabled={change.isPending}>
              {change.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AppearanceTab() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Personalise how Optima looks for your eyes.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold">Theme</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ThemeOption
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
              label="Dark"
              description="Default dark experience with neon accents."
              icon={<Moon className="size-4" />}
              preview="dark"
            />
            <ThemeOption
              active={theme === "light"}
              onClick={() => setTheme("light")}
              label="Light"
              description="Crisp light theme for bright environments."
              icon={<Sun className="size-4" />}
              preview="light"
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-3">
          <div>
            <p className="text-sm font-semibold">Collapse sidebar by default</p>
            <p className="text-xs text-muted-foreground">
              Save horizontal space across all pages.
            </p>
          </div>
          <Switch
            checked={sidebarCollapsed}
            onCheckedChange={(checked) => setSidebarCollapsed(checked === true)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyTab({ user }: { user: User }) {
  if (user.role === "SuperAdmin") {
    return (
      <Notice tone="info">
        SuperAdmin accounts are not bound to a single workspace. Use the Companies page to manage
        tenants.
      </Notice>
    );
  }
  if (!user.companyId) {
    return (
      <Notice tone="warn" title="Account not linked to a company">
        Ask a SuperAdmin to assign your account to a company workspace.
      </Notice>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>You're currently working in this company workspace.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo text-sm font-bold text-white">
          {user.companyId.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Company workspace</p>
          <p className="font-mono text-xs text-muted-foreground">{user.companyId}</p>
        </div>
        <Badge tone="ai">
          <Sparkles className="size-3" /> Premium
        </Badge>
      </CardContent>
    </Card>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 break-all text-sm font-semibold">{value}</p>
    </div>
  );
}

function PasswordField({
  label,
  register,
  error,
  visible,
  onToggle,
}: {
  label: string;
  register: ReturnType<ReturnType<typeof useForm>["register"]>;
  error?: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          {...register}
          type={visible ? "text" : "password"}
          className="pl-9 pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-surface-elevated"
          tabIndex={-1}
          aria-label="Toggle password visibility"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-crimson">{error}</p>}
    </div>
  );
}

function ThemeOption({
  active,
  onClick,
  label,
  description,
  icon,
  preview,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  description: string;
  icon: React.ReactNode;
  preview: "dark" | "light";
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`flex flex-col gap-3 rounded-[var(--radius-lg)] border p-3 text-left transition-colors ${
        active ? "border-primary bg-primary/10" : "border-border bg-surface-elevated/60 hover:bg-surface-elevated"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex size-8 items-center justify-center rounded-md ${
            preview === "dark" ? "bg-navy text-white" : "bg-white text-navy"
          }`}
        >
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        {active && <Badge tone="primary" className="ml-auto">Active</Badge>}
      </div>
      <div
        className={`h-20 overflow-hidden rounded-md border ${
          preview === "dark" ? "border-white/10" : "border-black/10"
        }`}
        style={{
          background:
            preview === "dark"
              ? "linear-gradient(135deg, #0B1220, #111827, #1f2937)"
              : "linear-gradient(135deg, #ffffff, #f1f5f9, #e2e8f0)",
        }}
      >
        <div className="flex h-full items-center gap-2 px-3">
          <span
            className={`size-3 rounded-full ${preview === "dark" ? "bg-rose-400" : "bg-rose-500"}`}
          />
          <span
            className={`size-3 rounded-full ${preview === "dark" ? "bg-amber-400" : "bg-amber-500"}`}
          />
          <span
            className={`size-3 rounded-full ${preview === "dark" ? "bg-emerald-400" : "bg-emerald-500"}`}
          />
          <span
            className={`ml-auto rounded-md px-2 py-0.5 text-[10px] font-bold ${
              preview === "dark"
                ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                : "bg-gradient-to-r from-violet-600 to-pink-600 text-white"
            }`}
          >
            Optima
          </span>
        </div>
      </div>
    </motion.button>
  );
}
