import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { sheetService, userService } from "../api/services";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { TextInput } from "../components/ui/FormControls";
import type { Sheet, User } from "../types/domain";

export function SheetsPage({ navigate }: { navigate: (path: string) => void }) {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [counters, setCounters] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const [sheetData, counterData] = await Promise.all([sheetService.list(), userService.counters()]);
    setSheets(sheetData.sheets);
    setCounters(counterData);
  };

  useEffect(() => {
    Promise.all([sheetService.list(), userService.counters()])
      .then(([sheetData, counterData]) => {
        setSheets(sheetData.sheets);
        setCounters(counterData);
      })
      .catch(() => undefined);
  }, []);

  const createSheet = async (event: FormEvent) => {
    event.preventDefault();
    await sheetService.create({ name, description, status: "in_progress" });
    setName("");
    setDescription("");
    await load();
  };

  const assignCounter = async (sheetId: string, compteurName: string) => {
    await sheetService.assignCounter(sheetId, compteurName);
    await load();
  };

  return (
    <section className="grid two">
      <div className="card">
        <h2>Create sheet</h2>
        <form className="form" onSubmit={createSheet}>
          <TextInput label="Name" value={name} onChange={setName} required />
          <TextInput label="Description" value={description} onChange={setDescription} />
          <button className="button primary">Create sheet</button>
        </form>
      </div>
      <div className="card">
        <h2>Available counters</h2>
        {counters.map((counter) => (
          <div className="list-row" key={counter._id}>
            <strong>{counter.name || counter.email}</strong>
            <span>{counter.email}</span>
          </div>
        ))}
      </div>
      <div className="card wide">
        <h2>Sheets</h2>
        {sheets.length ? sheets.map((sheet) => (
          <div className="sheet-row" key={sheet._id}>
            <button className="list-row" onClick={() => navigate(`/app/sheets/${sheet._id}`)}>
              <strong>{sheet.name}</strong>
              <span>{sheet.description || "No description"}</span>
              <Badge tone="blue">{sheet.status}</Badge>
            </button>
            <select defaultValue="" onChange={(event) => event.target.value && assignCounter(sheet._id, event.target.value)}>
              <option value="">Assign compteur</option>
              {counters.map((counter) => <option key={counter._id} value={counter.name || counter.email}>{counter.name || counter.email}</option>)}
            </select>
            <span>{sheet.assignedCompteurs?.join(", ") || "No compteur assigned"}</span>
          </div>
        )) : <EmptyState title="No sheets" body="Create a sheet and assign counters to prepare counting work." />}
      </div>
    </section>
  );
}
