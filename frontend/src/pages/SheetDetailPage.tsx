import { useEffect, useState } from "react";
import { sheetService, userService } from "../api/services";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import type { Sheet, User } from "../types/domain";

export function SheetDetailPage({ id, navigate }: { id: string; navigate: (path: string) => void }) {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [counters, setCounters] = useState<User[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    const [sheetData, counterData] = await Promise.all([sheetService.get(id), userService.counters()]);
    setSheet(sheetData.sheet);
    setCounters(counterData);
  };

  useEffect(() => {
    Promise.all([sheetService.get(id), userService.counters()])
      .then(([sheetData, counterData]) => {
        setSheet(sheetData.sheet);
        setCounters(counterData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load sheet"));
  }, [id]);

  const assignCounter = async (compteurName: string) => {
    await sheetService.assignCounter(id, compteurName);
    await load();
  };

  return (
    <section className="grid two">
      <div className="card">
        <button className="button" onClick={() => navigate("/app/sheets")}>Back to sheets</button>
        <p className="eyebrow">Inventory sheet</p>
        <h2>{sheet?.name || "Sheet detail"}</h2>
        {error && <p className="notice error">{error}</p>}
        {sheet && (
          <>
            <p className="muted">{sheet.description || "No description"}</p>
            <Badge tone="blue">{sheet.status}</Badge>
          </>
        )}
      </div>
      <div className="card">
        <h2>Assign compteur</h2>
        <select defaultValue="" onChange={(event) => event.target.value && assignCounter(event.target.value)}>
          <option value="">Select compteur</option>
          {counters.map((counter) => (
            <option key={counter._id} value={counter.name || counter.email}>
              {counter.name || counter.email}
            </option>
          ))}
        </select>
        <p className="muted">Assignment updates the sheet and prepares the future native mobile task list.</p>
      </div>
      <div className="card">
        <h2>Assigned counters</h2>
        {sheet?.assignedCompteurs?.length ? (
          sheet.assignedCompteurs.map((counter) => (
            <div className="list-row" key={counter}>
              <strong>{counter}</strong>
              <span>Assigned to this sheet</span>
            </div>
          ))
        ) : (
          <EmptyState title="No counters assigned" body="Assign at least one compteur before starting terrain counting." />
        )}
      </div>
      <div className="card">
        <h2>Mobile preparation</h2>
        <p className="muted">
          The future native mobile app will use `/api/terrain` to fetch assigned sessions, start counts, pause/resume,
          and sync counted items. The compteur client must only receive blind-counting article fields.
        </p>
      </div>
    </section>
  );
}
