import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  FileSpreadsheet,
  FileWarning,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

export type CSVPreview = {
  file: File;
  headers: string[];
  rows: string[][];
  rowCount: number;
  warnings: string[];
};

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const cleaned = text.replace(/^\uFEFF/, "");
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const split = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells.map((cell) => cell.trim());
  };
  const headers = split(lines[0]!);
  const rows = lines.slice(1).map(split);
  return { headers, rows };
}

export function CSVDropzone({
  file,
  onFileChange,
  expectedColumns,
  description,
  maxSizeMB = 10,
  className,
}: {
  file: File | null;
  onFileChange: (file: File | null, preview: CSVPreview | null) => void;
  expectedColumns?: string[];
  description?: string;
  maxSizeMB?: number;
  className?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<CSVPreview | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    async (input: File | null) => {
      setError(null);
      if (!input) {
        setPreview(null);
        onFileChange(null, null);
        return;
      }
      if (input.size > maxSizeMB * 1024 * 1024) {
        setError(`File is larger than ${maxSizeMB}MB.`);
        return;
      }
      const isCSV =
        input.type === "text/csv" || /\.csv$/i.test(input.name) || input.type === "application/vnd.ms-excel";
      if (!isCSV) {
        setError("Only CSV files are accepted.");
        return;
      }
      setParsing(true);
      try {
        const text = await input.text();
        const { headers, rows } = parseCSV(text);
        const warnings: string[] = [];
        if (expectedColumns && expectedColumns.length > 0) {
          const headerSet = new Set(headers.map((header) => header.toLowerCase()));
          const missing = expectedColumns.filter((col) => !headerSet.has(col.toLowerCase()));
          if (missing.length > 0) {
            warnings.push(`Missing recommended columns: ${missing.join(", ")}`);
          }
        }
        const next: CSVPreview = {
          file: input,
          headers,
          rows,
          rowCount: rows.length,
          warnings,
        };
        setPreview(next);
        onFileChange(input, next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not parse the CSV.");
      } finally {
        setParsing(false);
      }
    },
    [expectedColumns, maxSizeMB, onFileChange],
  );

  const onSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0] || null);
  };

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragOver(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileChange(null, null);
  };

  const previewRows = useMemo(() => preview?.rows.slice(0, 5) || [], [preview]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <AnimatePresence initial={false} mode="wait">
        {!file && !preview ? (
          <motion.label
            key="drop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-surface-elevated/40 px-6 py-8 text-center transition-colors",
              dragOver && "border-primary bg-primary/10",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onSelect}
            />
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl border border-border bg-surface text-muted-foreground transition-colors",
                dragOver && "border-primary text-primary",
              )}
            >
              {parsing ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
            </span>
            <div>
              <p className="text-sm font-semibold">
                Drop a CSV here or <span className="ai-text">browse</span>
              </p>
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            {expectedColumns && expectedColumns.length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {expectedColumns.map((column) => (
                  <Badge key={column} tone="outline" className="text-[10px]">
                    {column}
                  </Badge>
                ))}
              </div>
            )}
          </motion.label>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-[var(--radius-lg)] border border-border bg-surface-elevated/60 p-4"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <FileSpreadsheet className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {preview ? `${preview.rowCount} rows • ${preview.headers.length} columns` : "Preparing preview…"}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={clear} aria-label="Remove file">
                <Trash2 className="size-4" />
              </Button>
            </div>

            {preview && preview.warnings.length > 0 && (
              <Notice tone="warn" className="mb-3">
                <div className="flex items-center gap-1">
                  <FileWarning className="size-3.5" /> {preview.warnings[0]}
                </div>
              </Notice>
            )}

            {preview && preview.headers.length > 0 && (
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface">
                <table className="min-w-full text-xs">
                  <thead className="bg-surface-elevated/60">
                    <tr>
                      {preview.headers.map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap px-3 py-2 text-left font-semibold text-muted-foreground"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => (
                      <tr key={index} className="border-t border-border/60">
                        {preview.headers.map((_, columnIndex) => (
                          <td key={columnIndex} className="whitespace-nowrap px-3 py-1.5 text-foreground/85">
                            {row[columnIndex] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Badge tone="emerald" className="gap-1">
                <CheckCircle2 className="size-3" />
                Ready to import
              </Badge>
              {preview && (
                <span className="text-xs text-muted-foreground">
                  Showing first {previewRows.length} of {preview.rowCount} rows
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
