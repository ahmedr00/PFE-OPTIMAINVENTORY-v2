import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  Loader2,
  Rocket,
  Sparkles,
  UserCheck,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { toast } from "sonner";
import { inventoryService, userService, warehouseService } from "@/api/services";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Input";
import { CSVDropzone, type CSVPreview } from "@/components/csv/CSVDropzone";
import { Notice } from "@/components/ui/Notice";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useInventoryWizard, TOTAL_STEPS } from "@/store/inventoryWizard";
import type { User, Warehouse } from "@/types/domain";

const STEPS = [
  { title: "Warehouse", subtitle: "Pick the site", icon: WarehouseIcon },
  { title: "Counter", subtitle: "Assign someone", icon: UserCheck },
  { title: "Configure", subtitle: "Name & notes", icon: ClipboardList },
  { title: "Technical CSV", subtitle: "Upload stock", icon: FileSpreadsheet },
  { title: "Review", subtitle: "Confirm details", icon: Sparkles },
  { title: "Launch", subtitle: "Send it live", icon: Rocket },
];

export function InventoryWizard({
  companyId,
  defaultOpen,
  onCreated,
}: {
  companyId: string;
  defaultOpen?: boolean;
  onCreated?: (inventoryId: string) => void;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const wizard = useInventoryWizard();
  const queryClient = useQueryClient();

  const warehouses = useQuery({
    queryKey: ["warehouses", companyId],
    queryFn: () => warehouseService.byCompany(companyId),
    enabled: open && Boolean(companyId),
  });
  const counters = useQuery({
    queryKey: ["counters"],
    queryFn: userService.counters,
    enabled: open,
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const inventory = await inventoryService.create({
        companyId,
        warehouseId: wizard.warehouseId,
        name: wizard.name,
        status: "Open",
        assignedCounterId: wizard.counterId || undefined,
      });
      if (csvFile) {
        await inventoryService.uploadTechnical(inventory._id, csvFile);
      }
      return inventory;
    },
    onSuccess: (inventory) => {
      toast.success("Inventory launched", {
        description: csvFile ? "Technical CSV uploaded successfully" : "Counter can now begin counting",
      });
      queryClient.invalidateQueries({ queryKey: ["inventories", companyId] });
      setOpen(false);
      setCsvFile(null);
      setCsvPreview(null);
      wizard.reset();
      onCreated?.(inventory._id);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not create inventory");
    },
  });

  const stepValid = (() => {
    switch (wizard.step) {
      case 0:
        return Boolean(wizard.warehouseId);
      case 1:
        return Boolean(wizard.counterId);
      case 2:
        return wizard.name.trim().length >= 2;
      case 3:
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  })();

  const selectedWarehouse: Warehouse | undefined = (warehouses.data || []).find(
    (warehouse) => warehouse._id === wizard.warehouseId,
  );
  const selectedCounter: User | undefined = (counters.data || []).find(
    (counter) => counter._id === wizard.counterId,
  );

  const closeAndReset = () => {
    setOpen(false);
    setCsvFile(null);
    setCsvPreview(null);
    wizard.reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setCsvFile(null);
          setCsvPreview(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ai">
          <Sparkles className="size-4" /> New inventory
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl gap-0 p-0">
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-4 text-ai-from" /> Launch a new inventory
          </DialogTitle>
          <DialogDescription>
            Six guided steps. We'll save your progress so you can return any time.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border bg-surface-elevated/40 px-6 py-4">
          <Stepper />
        </div>

        <div className="min-h-[360px] p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={wizard.step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            >
              {wizard.step === 0 && (
                <WarehouseStep
                  warehouses={warehouses.data || []}
                  selectedId={wizard.warehouseId}
                  onSelect={(id) => wizard.set({ warehouseId: id })}
                />
              )}
              {wizard.step === 1 && (
                <CounterStep
                  counters={counters.data || []}
                  selectedId={wizard.counterId}
                  onSelect={(id) => wizard.set({ counterId: id })}
                />
              )}
              {wizard.step === 2 && (
                <ConfigureStep
                  name={wizard.name}
                  notes={wizard.notes}
                  onName={(name) => wizard.set({ name })}
                  onNotes={(notes) => wizard.set({ notes })}
                />
              )}
              {wizard.step === 3 && (
                <TechnicalStep
                  file={csvFile}
                  onFile={(file, preview) => {
                    setCsvFile(file);
                    setCsvPreview(preview);
                    wizard.set({ technicalFileName: file?.name || null });
                  }}
                  preview={csvPreview}
                />
              )}
              {wizard.step === 4 && (
                <ReviewStep
                  warehouse={selectedWarehouse}
                  counter={selectedCounter}
                  name={wizard.name}
                  notes={wizard.notes}
                  csvPreview={csvPreview}
                />
              )}
              {wizard.step === 5 && <LaunchStep pending={create.isPending} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-elevated/40 px-6 py-4">
          <Button
            variant="ghost"
            onClick={closeAndReset}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={wizard.prev}
              disabled={wizard.step === 0}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            {wizard.step < TOTAL_STEPS - 1 ? (
              <Button variant="ai" onClick={wizard.next} disabled={!stepValid}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button variant="ai" onClick={() => create.mutate()} disabled={create.isPending}>
                {create.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Rocket className="size-4" />
                )}
                Launch inventory
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stepper() {
  const wizard = useInventoryWizard();
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = wizard.step === index;
        const isComplete = wizard.step > index;
        return (
          <li key={step.title} className="flex items-center gap-2">
            <button
              onClick={() => wizard.setStep(index)}
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-md)] border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : isComplete
                    ? "border-emerald/40 bg-emerald/10 text-emerald"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-md text-[10px] font-bold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-emerald text-white"
                      : "bg-surface-elevated text-muted-foreground",
                )}
              >
                {isComplete ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3" />}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {index < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-4 sm:w-6",
                  isComplete ? "bg-emerald/60" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function WarehouseStep({
  warehouses,
  selectedId,
  onSelect,
}: {
  warehouses: Warehouse[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <StepHeader title="Pick the warehouse" subtitle="Inventory will be scoped to this location." />
      {warehouses.length === 0 ? (
        <Notice tone="warn">Create at least one warehouse before launching an inventory.</Notice>
      ) : (
        <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1">
          {warehouses.map((warehouse) => {
            const active = warehouse._id === selectedId;
            return (
              <button
                key={warehouse._id}
                onClick={() => onSelect(warehouse._id)}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface-elevated/60 hover:bg-surface-elevated",
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-indigo/20 text-primary">
                  <WarehouseIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{warehouse.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {warehouse.location || "No location"}
                  </p>
                </div>
                {active && <Badge tone="primary">Selected</Badge>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CounterStep({
  counters,
  selectedId,
  onSelect,
}: {
  counters: User[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <StepHeader
        title="Assign a counter"
        subtitle="The counter will see this inventory in their mobile app."
      />
      {counters.length === 0 ? (
        <Notice tone="warn">No counters yet. Create a Compteur user from the Users page.</Notice>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {counters.map((counter) => {
            const active = counter._id === selectedId;
            return (
              <button
                key={counter._id}
                onClick={() => onSelect(counter._id)}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface-elevated/60 hover:bg-surface-elevated",
                )}
              >
                <Avatar className="size-9">
                  <AvatarFallback>{initials(counter.name, counter.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {counter.name || counter.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{counter.email}</p>
                </div>
                {active && <Badge tone="primary">Selected</Badge>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConfigureStep({
  name,
  notes,
  onName,
  onNotes,
}: {
  name: string;
  notes: string;
  onName: (value: string) => void;
  onNotes: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        title="Name & describe"
        subtitle="Give this inventory a clear name your team will recognise."
      />
      <div className="flex flex-col gap-1.5">
        <Label>Inventory name</Label>
        <Input
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="e.g. INV-2026-Q2-Casablanca"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          rows={4}
          value={notes}
          onChange={(event) => onNotes(event.target.value)}
          placeholder="Anything the counter should know before starting…"
        />
      </div>
    </div>
  );
}

function TechnicalStep({
  file,
  preview,
  onFile,
}: {
  file: File | null;
  preview: CSVPreview | null;
  onFile: (file: File | null, preview: CSVPreview | null) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        title="Upload technical CSV (optional)"
        subtitle="Provides the theoretical quantity baseline for comparison."
      />
      <CSVDropzone
        file={file}
        onFileChange={onFile}
        expectedColumns={["code", "technicalQty"]}
        description="Two columns are enough: code (or reference) and technicalQty"
      />
      {preview && (
        <Notice tone="info">
          {preview.rowCount} rows ready. We'll match them to articles in this warehouse on launch.
        </Notice>
      )}
    </div>
  );
}

function ReviewStep({
  warehouse,
  counter,
  name,
  notes,
  csvPreview,
}: {
  warehouse?: Warehouse;
  counter?: User;
  name: string;
  notes: string;
  csvPreview: CSVPreview | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        title="Review and launch"
        subtitle="A summary before we send it to your counter."
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <ReviewCard icon={<WarehouseIcon className="size-4" />} label="Warehouse">
          <p className="text-sm font-semibold">{warehouse?.name || "—"}</p>
          {warehouse?.location && (
            <p className="text-xs text-muted-foreground">{warehouse.location}</p>
          )}
        </ReviewCard>
        <ReviewCard icon={<UserCheck className="size-4" />} label="Counter">
          <p className="text-sm font-semibold">{counter?.name || counter?.email || "—"}</p>
          {counter?.email && (
            <p className="text-xs text-muted-foreground">{counter.email}</p>
          )}
        </ReviewCard>
        <ReviewCard icon={<ClipboardList className="size-4" />} label="Inventory name">
          <p className="text-sm font-semibold">{name || "—"}</p>
          {notes && <p className="text-xs text-muted-foreground">{notes}</p>}
        </ReviewCard>
        <ReviewCard icon={<FileSpreadsheet className="size-4" />} label="Technical CSV">
          {csvPreview ? (
            <p className="text-sm font-semibold">
              {csvPreview.file.name}
              <span className="ml-2 text-xs text-muted-foreground">
                ({csvPreview.rowCount} rows)
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not provided</p>
          )}
        </ReviewCard>
      </div>
    </div>
  );
}

function LaunchStep({ pending }: { pending: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
      <span
        className={cn(
          "ai-gradient flex size-16 items-center justify-center rounded-2xl text-white shadow-[0_20px_60px_-20px_rgb(var(--ai-from)/0.6)]",
          pending && "animate-pulse",
        )}
      >
        <Rocket className="size-7" />
      </span>
      <div className="space-y-1">
        <h3 className="text-xl font-bold tracking-tight">Ready to launch</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Hit the button below to create the inventory and notify your counter. They'll see it
          immediately in the mobile app.
        </p>
      </div>
    </div>
  );
}

function ReviewCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
