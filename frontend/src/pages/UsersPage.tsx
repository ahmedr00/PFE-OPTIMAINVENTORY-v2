import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Crown,
  Filter,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { userService } from "@/api/services";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { DataTable } from "@/components/data-table/DataTable";
import { initials, formatRelativeDate } from "@/lib/format";
import { displayRole } from "@/utils/roles";
import type { User } from "@/types/domain";

const ROLE_TONE: Record<string, "ai" | "primary" | "emerald" | "amber" | "slate"> = {
  SuperAdmin: "ai",
  CompanyOwner: "primary",
  Admin: "primary",
  Gestionnaire: "emerald",
  InventoryPersonnel: "amber",
  Compteur: "amber",
};

const createSchema = z.object({
  name: z.string().min(2, "Required"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["Admin", "Gestionnaire", "InventoryPersonnel", "CompanyOwner"]),
});

export function UsersPage({ currentUser }: { currentUser: User }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const users = useQuery({ queryKey: ["users"], queryFn: userService.list });
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      toast.success("User removed");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not remove user"),
  });

  const filtered = useMemo(() => {
    const list = users.data?.users || [];
    return list.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (search.trim()) {
        const lower = search.toLowerCase();
        return (
          (user.name || "").toLowerCase().includes(lower) ||
          user.email.toLowerCase().includes(lower)
        );
      }
      return true;
    });
  }, [users.data, search, roleFilter]);

  const counts = useMemo(() => {
    const list = users.data?.users || [];
    return {
      total: list.length,
      admins: list.filter((u) => u.role === "Admin" || u.role === "CompanyOwner").length,
      gestionnaires: list.filter((u) => u.role === "Gestionnaire").length,
      counters: list.filter((u) => u.role === "InventoryPersonnel" || u.role === "Compteur").length,
    };
  }, [users.data]);

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback>{initials(row.original.name, row.original.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {row.original.name || "Unnamed"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge tone={ROLE_TONE[row.original.role] || "slate"}>
            {row.original.role === "SuperAdmin" && <Crown className="size-3" />}
            {displayRole(row.original.role)}
          </Badge>
        ),
      },
      {
        accessorKey: "lastLogin",
        header: "Last login",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(row.original.lastLogin)}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original._id === currentUser._id ? (
            <Badge tone="outline" className="text-[10px]">
              You
            </Badge>
          ) : row.original.role === "SuperAdmin" ? (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Protected
            </span>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                if (window.confirm(`Remove ${row.original.name || row.original.email}?`)) {
                  remove.mutate(row.original._id);
                }
              }}
              aria-label="Remove user"
            >
              <Trash2 className="size-4 text-crimson" />
            </Button>
          ),
        size: 48,
      },
    ],
    [currentUser._id, remove],
  );

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Team"
        title="Users"
        description="Invite admins, gestionnaires, and counters into your workspace."
        actions={<CreateUserDialog />}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryStat label="Total" value={counts.total} icon={<Users className="size-4" />} />
        <SummaryStat
          label="Admins"
          value={counts.admins}
          icon={<ShieldCheck className="size-4" />}
          tone="primary"
        />
        <SummaryStat
          label="Gestionnaires"
          value={counts.gestionnaires}
          icon={<UserPlus className="size-4" />}
          tone="emerald"
        />
        <SummaryStat
          label="Counters"
          value={counts.counters}
          icon={<KeyRound className="size-4" />}
          tone="amber"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4 text-muted-foreground" /> Directory
            </CardTitle>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 w-72 pl-9"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 w-44">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                  <SelectItem value="CompanyOwner">Admin</SelectItem>
                  <SelectItem value="Admin">Admin (legacy)</SelectItem>
                  <SelectItem value="Gestionnaire">Gestionnaire</SelectItem>
                  <SelectItem value="InventoryPersonnel">Compteur</SelectItem>
                  <SelectItem value="Compteur">Compteur (legacy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable<User, unknown>
              columns={columns}
              data={filtered}
              pageSize={12}
              emptyState={
                <EmptyState
                  icon={Users}
                  title="No users match"
                  body="Adjust filters or invite a new user."
                />
              }
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [generated, setGenerated] = useState<{ email: string; password: string } | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<{ name: string; email: string; role: "Admin" | "Gestionnaire" | "InventoryPersonnel" | "CompanyOwner" }>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", role: "Gestionnaire" },
  });

  const create = useMutation({
    mutationFn: (values: { name: string; email: string; role: string }) => userService.create(values),
    onSuccess: (user) => {
      toast.success("User created", {
        description: user.temporaryPassword ? "Temporary password generated" : "Welcome email queued",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (user.temporaryPassword) {
        setGenerated({ email: user.email, password: user.temporaryPassword });
      } else {
        setOpen(false);
      }
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not create user");
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          setGenerated(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ai">
          <Plus className="size-4" /> Invite user
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>
            We'll send the invite or generate a temporary password.
          </DialogDescription>
        </DialogHeader>
        {generated ? (
          <div className="flex flex-col gap-3">
            <Notice tone="success" title="User created">
              Send these credentials securely to the new user. The password is shown once.
            </Notice>
            <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <p className="break-all text-sm font-semibold">{generated.email}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Temporary password
              </p>
              <p className="break-all font-mono text-sm text-amber">{generated.password}</p>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setGenerated(null)}>
                Create another
              </Button>
              <Button variant="ai" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label>Full name</Label>
              <Input placeholder="Jane Smith" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-crimson">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="email"
                  placeholder="jane@company.com"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-crimson">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(value) =>
                  form.setValue(
                    "role",
                    value as "Admin" | "Gestionnaire" | "InventoryPersonnel" | "CompanyOwner",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CompanyOwner">Admin (Company owner)</SelectItem>
                  <SelectItem value="Gestionnaire">Gestionnaire</SelectItem>
                  <SelectItem value="InventoryPersonnel">Compteur (counter)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="ai" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                Create user
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "primary" | "emerald" | "amber";
}) {
  const styles =
    tone === "primary"
      ? "bg-primary/15 text-primary"
      : tone === "emerald"
        ? "bg-emerald/15 text-emerald"
        : tone === "amber"
          ? "bg-amber/15 text-amber"
          : "bg-surface-elevated text-muted-foreground";

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <span className={`flex size-10 items-center justify-center rounded-xl ${styles}`}>{icon}</span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-bold tabular">{value}</p>
      </div>
    </div>
  );
}
