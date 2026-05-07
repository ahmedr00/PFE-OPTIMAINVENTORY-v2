import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Package, Plus } from "lucide-react";
import { warehouseService } from "@/api/services";
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
import { Notice } from "@/components/ui/Notice";
import { CSVDropzone, type CSVPreview } from "@/components/csv/CSVDropzone";
import { MapPicker } from "@/components/MapPicker";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  location: z.string().optional(),
});

const ARTICLE_COLUMNS = [
  "code",
  "name",
  "barcode",
  "location",
  "theoreticalQuantity",
  "unitPrice",
  "category",
  "unit",
];

export function WarehouseCreateDialog({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ latitude: number | null; longitude: number | null }>(
    { latitude: null, longitude: null },
  );
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);

  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", location: "" },
  });

  const reset = () => {
    form.reset();
    setPosition({ latitude: null, longitude: null });
    setCsvFile(null);
    setCsvPreview(null);
  };

  const create = useMutation({
    mutationFn: async (values: { name: string; location?: string }) => {
      return warehouseService.createWithArticles({
        name: values.name,
        location: values.location,
        latitude: position.latitude ?? undefined,
        longitude: position.longitude ?? undefined,
        file: csvFile,
      });
    },
    onSuccess: (result) => {
      toast.success(
        result.imported
          ? `Warehouse created with ${result.imported} articles`
          : "Warehouse created",
        {
          description: csvFile
            ? `${result.upserted} new, ${result.modified} updated`
            : "Add articles via CSV later if needed.",
        },
      );
      queryClient.invalidateQueries({ queryKey: ["warehouses", companyId] });
      setOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not create warehouse");
    },
  });

  const submit = form.handleSubmit((values) => {
    if (!companyId) {
      toast.error("Your account is not linked to a company yet.");
      return;
    }
    create.mutate(values);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ai">
          <Plus className="size-4" /> New warehouse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-4 text-primary" /> Create a warehouse
          </DialogTitle>
          <DialogDescription>
            Pin a location on the map and optionally import an article catalog from CSV.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Warehouse name</Label>
              <Input
                placeholder="Casablanca North"
                {...form.register("name")}
                aria-invalid={!!form.formState.errors.name}
              />
              {form.formState.errors.name && (
                <p className="text-xs font-medium text-crimson">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Location label</Label>
              <Input
                placeholder="Auto-filled from map"
                {...form.register("location")}
              />
              <p className="text-[11px] text-muted-foreground">
                {position.latitude !== null && position.longitude !== null
                  ? `Pinned at ${position.latitude}, ${position.longitude}`
                  : "Click the map to pin a coordinate."}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Article CSV (optional)</Label>
              <CSVDropzone
                file={csvFile}
                onFileChange={(file, preview) => {
                  setCsvFile(file);
                  setCsvPreview(preview);
                }}
                expectedColumns={ARTICLE_COLUMNS}
                description="Upload a CSV with code, name, barcode, location, theoreticalQuantity, unitPrice…"
              />
              {csvPreview && csvPreview.warnings.length === 0 && (
                <Notice tone="info">
                  {csvPreview.rowCount} rows ready to import on creation.
                </Notice>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label>Pin location on map</Label>
            <MapPicker
              height={400}
              value={
                position.latitude !== null && position.longitude !== null
                  ? { latitude: position.latitude, longitude: position.longitude }
                  : null
              }
              onChange={({ latitude, longitude, label }) => {
                setPosition({ latitude, longitude });
                if (label) form.setValue("location", label);
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 lg:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="ai" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create warehouse
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
