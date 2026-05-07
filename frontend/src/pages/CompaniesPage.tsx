import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  Mail,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { companyService, trialRequestService } from "@/api/services";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
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
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { initials, formatRelativeDate } from "@/lib/format";
import type { TrialRequest } from "@/types/domain";

export function CompaniesPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const companies = useQuery({ queryKey: ["companies"], queryFn: companyService.list });
  const requests = useQuery({
    queryKey: ["trial-requests"],
    queryFn: () => trialRequestService.list(),
  });

  const filteredCompanies = useMemo(() => {
    const list = companies.data || [];
    if (!search.trim()) return list;
    const lower = search.toLowerCase();
    return list.filter(
      (company) =>
        company.name.toLowerCase().includes(lower) ||
        (company.legalName || "").toLowerCase().includes(lower),
    );
  }, [companies.data, search]);

  const pending = (requests.data?.requests || []).filter((req) => req.status === "pending");
  const approved = (requests.data?.requests || []).filter((req) => req.status === "approved");
  const rejected = (requests.data?.requests || []).filter((req) => req.status === "rejected");

  const removeCompany = useMutation({
    mutationFn: (id: string) => companyService.delete(id),
    onSuccess: () => {
      toast.success("Company removed");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not remove company"),
  });

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Platform"
        title="Companies"
        description="Approve trial requests, provision tenants, and oversee customer health."
        actions={<CreateCompanyDialog />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat
          icon={<Building2 className="size-4" />}
          label="Companies"
          value={companies.data?.length || 0}
        />
        <SummaryStat
          icon={<CheckCircle2 className="size-4" />}
          label="Approved trials"
          value={approved.length}
          tone="emerald"
        />
        <SummaryStat
          icon={<Mail className="size-4" />}
          label="Pending requests"
          value={pending.length}
          tone={pending.length ? "amber" : "default"}
        />
      </div>

      <Card>
        <Tabs defaultValue="pending">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Trial requests</CardTitle>
                <CardDescription>
                  Review and approve incoming trial requests. Approving provisions a company and
                  admin automatically.
                </CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="pending">
                  Pending {pending.length > 0 && <CountPill value={pending.length} tone="amber" />}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved {approved.length > 0 && <CountPill value={approved.length} tone="emerald" />}
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected {rejected.length > 0 && <CountPill value={rejected.length} tone="crimson" />}
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="pending">
              <RequestKanban
                requests={pending}
                emptyTitle="No pending requests"
                emptyBody="You're all caught up."
                variant="pending"
              />
            </TabsContent>
            <TabsContent value="approved">
              <RequestKanban
                requests={approved}
                emptyTitle="No approvals yet"
                emptyBody="Approve a request to populate this tab."
                variant="approved"
              />
            </TabsContent>
            <TabsContent value="rejected">
              <RequestKanban
                requests={rejected}
                emptyTitle="No rejected requests"
                emptyBody="Rejected requests will land here."
                variant="rejected"
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Tenant directory</CardTitle>
              <CardDescription>All companies provisioned on Optima.</CardDescription>
            </div>
            <div className="relative w-72 max-w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search companies"
                className="h-9 pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {companies.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : filteredCompanies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No companies found"
              body="Approve a trial request or create one manually."
            />
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated/60">
                  <tr>
                    <Th>Company</Th>
                    <Th>Legal name</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company._id}
                      className="border-t border-border/60 transition-colors hover:bg-surface-elevated/60"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-indigo text-xs font-bold text-white">
                            {company.name.slice(0, 2).toUpperCase()}
                          </span>
                          <p className="font-semibold">{company.name}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {company.legalName || "—"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            if (window.confirm(`Remove ${company.name}?`)) {
                              removeCompany.mutate(company._id);
                            }
                          }}
                          aria-label="Remove company"
                        >
                          <Trash2 className="size-4 text-crimson" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function RequestKanban({
  requests,
  emptyTitle,
  emptyBody,
  variant,
}: {
  requests: TrialRequest[];
  emptyTitle: string;
  emptyBody: string;
  variant: "pending" | "approved" | "rejected";
}) {
  if (requests.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} icon={Mail} />;
  }
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.04 } },
      }}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {requests.map((request) => (
        <motion.div
          key={request._id}
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        >
          <RequestCard request={request} variant={variant} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function RequestCard({
  request,
  variant,
}: {
  request: TrialRequest;
  variant: "pending" | "approved" | "rejected";
}) {
  const queryClient = useQueryClient();
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const approve = useMutation({
    mutationFn: () => trialRequestService.approve(request._id),
    onSuccess: (result) => {
      toast.success(`Approved ${result.company.name}`, {
        description: result.temporaryPassword ? "Temporary password generated" : "Welcome email queued",
      });
      queryClient.invalidateQueries({ queryKey: ["trial-requests"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      if (result.temporaryPassword) {
        setCredentials({
          email: result.admin.email,
          password: result.temporaryPassword,
        });
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not approve"),
  });

  const reject = useMutation({
    mutationFn: () => trialRequestService.reject(request._id),
    onSuccess: () => {
      toast.success("Request rejected");
      queryClient.invalidateQueries({ queryKey: ["trial-requests"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not reject"),
  });

  const accent =
    variant === "pending"
      ? "border-amber/30 bg-amber/5"
      : variant === "approved"
        ? "border-emerald/30 bg-emerald/5"
        : "border-crimson/30 bg-crimson/5";

  return (
    <div className={`rounded-[var(--radius-lg)] border p-4 ${accent}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-9">
            <AvatarFallback>{initials(request.adminName, request.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{request.companyName}</p>
            <p className="truncate text-xs text-muted-foreground">{request.adminName}</p>
            <p className="truncate text-xs text-muted-foreground">{request.email}</p>
          </div>
        </div>
        <Badge
          tone={
            variant === "pending"
              ? "amber"
              : variant === "approved"
                ? "emerald"
                : "crimson"
          }
        >
          {variant}
        </Badge>
      </div>
      {request.message && (
        <p className="mt-2 line-clamp-3 rounded-md border border-border bg-surface p-2 text-xs text-foreground/85">
          {request.message}
        </p>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Requested {formatRelativeDate(request.createdAt)}
      </p>

      {credentials && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-amber/30 bg-amber/10 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber">
            Temporary password
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="break-all font-mono text-xs text-amber">{credentials.password}</p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                navigator.clipboard.writeText(credentials.password);
                toast.success("Copied to clipboard");
              }}
              aria-label="Copy password"
            >
              <ClipboardCopy className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {variant === "pending" && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="ai"
            size="sm"
            className="flex-1"
            onClick={() => approve.mutate()}
            disabled={approve.isPending}
          >
            {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => reject.mutate()}
            disabled={reject.isPending}
          >
            <X className="size-4" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}

function CreateCompanyDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(
      z.object({ name: z.string().min(2, "Required"), legalName: z.string().optional() }),
    ),
    defaultValues: { name: "", legalName: "" },
  });

  const create = useMutation({
    mutationFn: (values: { name: string; legalName?: string }) => companyService.create(values),
    onSuccess: () => {
      toast.success("Company created");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setOpen(false);
      form.reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not create company"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ai">
          <Plus className="size-4" /> New company
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a company</DialogTitle>
          <DialogDescription>
            Provision a new tenant manually. Trial requests are usually preferred.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) =>
            create.mutate({ name: values.name, legalName: values.legalName || undefined }),
          )}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label>Company name</Label>
            <Input placeholder="Acme Corp" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-crimson">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Legal name (optional)</Label>
            <Input placeholder="Acme S.A." {...form.register("legalName")} />
          </div>
          {!form.formState.isSubmitting && form.formState.errors.root && (
            <Notice tone="error">{String(form.formState.errors.root.message)}</Notice>
          )}
          <DialogFooter className="mt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="ai" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CountPill({
  value,
  tone,
}: {
  value: number;
  tone: "amber" | "emerald" | "crimson";
}) {
  const styles =
    tone === "amber"
      ? "bg-amber/15 text-amber"
      : tone === "emerald"
        ? "bg-emerald/15 text-emerald"
        : "bg-crimson/15 text-crimson";
  return (
    <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular ${styles}`}>
      {value}
    </span>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "emerald" | "amber";
}) {
  const styles =
    tone === "emerald"
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

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
