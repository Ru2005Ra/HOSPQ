import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDb } from "@/lib/hooks";
import { db } from "@/lib/store";
import { Trash2, Download } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/doctor")({
  head: () => ({ meta: [{ title: "Doctor — HospiQ" }] }),
  component: () => (<RoleGuard role="doctor"><Page /></RoleGuard>),
});

interface Line { medicineId?: string; name: string; qty: number; price: number; transfer?: boolean; }

function Page() {
  const tr = useT();
  const current = useDb((d) => d.queue?.find((t: any) => t.status === "with-doctor") ?? null);
  const meds = useDb((d) => d.medicines ?? []);
  const waiting = useDb((d) => d.queue?.filter((t: any) => t.status === "waiting").length ?? 0);
  const completed = useDb((d) => d.queue?.filter((t: any) => t.status === "done") ?? []);
  const [diagnosis, setDiagnosis] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const labCatalog = useDb((d) => d.labTests ?? []);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("HospiQ — Doctor's Consultation Report", 14, 18);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [[tr("date_col"), tr("patient_col"), tr("diagnosis"), `${tr("medicines")} (RWF)`]],
      body: completed.map(t => [
        new Date(t.updatedAt ?? t.createdAt).toLocaleString(),
        t.patientName,
        t.diagnosis?.substring(0, 30) + (t.diagnosis?.length > 30 ? "..." : "") || "—",
        (t.prescription ?? []).map(p => `${p.name} x${p.qty}`).join(", ") || "—",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 27, 61] },
    });
    doc.save(`hospiq-doctor-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Report exported successfully");
  };


  const reset = () => { setDiagnosis(""); setNote(""); setLines([]); };

  const callNext = () => {
    const t = db.callNext();
    if (!t) return toast.info(tr("queue_empty"));
    reset();
    toast.success(`${tr("calling")} ${t.patientName} (#${t.token})`);
  };

  const addLine = (id: string) => {
    const m = meds.find(x => x.id === id);
    if (!m) return;
    setLines(l => [...l, { medicineId: m.id, name: m.name, qty: 1, price: m.price, transfer: m.stock === 0 }]);
  };

  const submit = () => {
    if (!current) return;
    if (!diagnosis.trim()) return toast.error(tr("diagnosis_required"));
    db.submitDiagnosis(current.id, { diagnosis, prescription: lines, doctorNote: note });
    toast.success(tr("sent_pharmacy"));
    reset();
  };

  const sendToLab = () => {
    if (!current) return;
    db.sendToLab(current.id);
    toast.success(tr("sent_to_lab"));
    reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("doctor_title")}</h1>
            <p className="mt-2 text-muted-foreground">{waiting} {waiting === 1 ? tr("patient_waiting") : tr("patients_waiting")}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportPdf} variant="outline" className="border-accent text-accent hover:bg-accent/10"><Download className="mr-2 h-4 w-4" /> {tr("export_pdf")}</Button>
            <Button onClick={callNext} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={!!current}>{tr("call_next")}</Button>
          </div>
        </div>

        {!current && (
          <div className="mt-10 rounded-xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
            <p className="text-muted-foreground">{tr("no_patient")}</p>
          </div>
        )}

        {current && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-5">
              <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-xl font-semibold text-foreground">{current.patientName} <span className="ml-2 rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">#{current.token}</span></h2>
                <p className="text-xs text-muted-foreground">{tr("insurance_col")}: {current.insurance}</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <Vital label={tr("weight")} value={`${current.vitals.weight} kg`} />
                  <Vital label={tr("temp")} value={`${current.vitals.temperature} °C`} />
                  <Vital label={tr("bp")} value={current.vitals.bloodPressure || "—"} />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <Label>{tr("diagnosis")}</Label>
                <Textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="mt-1" rows={3} />
                <Label className="mt-4 block">{tr("doctor_note")}</Label>
                <Textarea value={note} onChange={e => setNote(e.target.value)} className="mt-1" rows={2} />
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h3 className="text-lg font-semibold text-foreground">{tr("prescription")}</h3>
                <div className="mt-3 flex gap-2">
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onChange={e => { if (e.target.value) { addLine(e.target.value); e.target.value = ""; } }}>
                    <option value="">{tr("add_medicine")}</option>
                    {meds.map(m => <option key={m.id} value={m.id}>{m.name} — {m.stock} in stock — {m.price} RWF</option>)}
                  </select>
                </div>
                <ul className="mt-4 divide-y divide-border">
                  {lines.map((l, i) => (
                    <li key={i} className="flex items-center gap-3 py-3 text-sm">
                      <span className="flex-1">{l.name} {l.transfer && <em className="text-destructive">{tr("out_of_stock")}</em>}</span>
                      <Input className="w-20" type="number" min={1} value={l.qty} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, qty: Math.max(1, +e.target.value) } : x))} />
                      <span className="w-24 text-right text-muted-foreground">{l.transfer ? "—" : `${(l.price * l.qty).toLocaleString()} RWF`}</span>
                      <button onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></button>
                    </li>
                  ))}
                  {lines.length === 0 && <li className="py-4 text-center text-xs text-muted-foreground">No medicines added.</li>}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={submit} size="lg" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">{tr("submit_patient")}</Button>
                <Button onClick={sendToLab} size="lg" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">{tr("send_to_lab")}</Button>
              </div>
            </div>

            <aside className="rounded-xl border border-border bg-secondary p-5 text-sm">
              <h3 className="font-semibold text-foreground">{tr("pharmacy_stock")}</h3>
              <ul className="mt-3 space-y-2">
                {meds.map(m => (
                  <li key={m.id} className="flex justify-between">
                    <span>{m.name}</span>
                    <span className={m.stock === 0 ? "text-destructive font-medium" : "text-muted-foreground"}>{m.stock}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-secondary p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-base font-semibold text-foreground">{value}</p></div>;
}
