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
import { useDb, useAuth } from "@/lib/hooks";
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
  const { user } = useAuth();
  const current = useDb((d) => (user ? d.queue?.find((t: any) => t.status === "with-doctor" && t.assignedDoctorId === user.id) ?? null : null));
  const meds = useDb((d) => d.medicines ?? []);
  const waiting = useDb((d) => {
    if (!user) return 0;
    const doctor = d.users?.find((u: any) => u.id === user.id && u.role === "doctor");
    const codes = doctor?.departmentCodes ?? [];
    return d.queue?.filter((t: any) => t.status === "waiting" && t.receptionApproved === true && (t.vitals?.weight && t.vitals?.temperature && t.vitals?.bloodPressure || t.emergencyAlert?.active === true) && codes.includes(t.departmentCode)).length ?? 0;
  });
  const completed = useDb((d) => d.queue?.filter((t: any) => t.status === "done" || t.status === "removed") ?? []);
  const [diagnosis, setDiagnosis] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const labCatalog = useDb((d) => d.labTests ?? []);
  const labResults = current?.labResults ?? [];

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("HospiQ — Doctor's Consultation Report", 14, 18);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [[tr("date_col"), tr("patient_col"), tr("diagnosis"), `${tr("medicines_col")} (RWF)`]],
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
    if (!user) return;
    const t = db.callNextForDoctor(user.id);
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
    setShowLabModal(true);
  };

  const submitLabRequest = () => {
    if (!current || !user) return;
    if (selectedTests.length === 0) {
      toast.error("Please select at least one test");
      return;
    }
    const tests = selectedTests.map(testId => ({ testId }));
    db.sendToLab(current.id, user.id, tests);
    toast.success("Patient sent to laboratory");
    setShowLabModal(false);
    setSelectedTests([]);
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
                  <Vital label={tr("weight")} value={current.vitals?.weight ? `${current.vitals.weight} kg` : "—"} />
                  <Vital label={tr("temp")} value={current.vitals?.temperature ? `${current.vitals.temperature} °C` : "—"} />
                  <Vital label={tr("bp")} value={current.vitals?.bloodPressure ? current.vitals.bloodPressure : "—"} />
                </div>
              </div>

              {labResults.length > 0 && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-[var(--shadow-card)]">
                  <h3 className="text-lg font-semibold text-foreground">Lab results</h3>
                  <div className="mt-3 space-y-3">
                    {labResults.map((result: any) => (
                      <div key={result.testId} className="rounded-lg border border-green-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground">{result.name}</p>
                          <span className="text-xs text-green-700">{result.enteredAt ? new Date(result.enteredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {result.result}{result.unit ? ` ${result.unit}` : ""}
                          {result.normalRange ? ` · Normal: ${result.normalRange}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
        {showLabModal && <LabTestModal ticketId={current?.id || ""} labCatalog={labCatalog} selectedTests={selectedTests} setSelectedTests={setSelectedTests} onSubmit={submitLabRequest} onClose={() => setShowLabModal(false)} />}
      </main>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-secondary p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-base font-semibold text-foreground">{value}</p></div>;
}

interface LabTestModalProps {
  ticketId: string;
  labCatalog: any[];
  selectedTests: string[];
  setSelectedTests: (tests: string[]) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function LabTestModal({ labCatalog, selectedTests, setSelectedTests, onSubmit, onClose }: LabTestModalProps) {
  const tr = useT();
  
  const toggleTest = (testId: string) => {
    setSelectedTests(
      selectedTests.includes(testId)
        ? selectedTests.filter(id => id !== testId)
        : [...selectedTests, testId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg max-h-80 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{tr("send_to_lab")}</h2>
        <div className="space-y-2 mb-4">
          {labCatalog.map((test: any) => (
            <label key={test.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTests.includes(test.id)}
                onChange={() => toggleTest(test.id)}
                className="w-4 h-4"
              />
              <span className="text-sm">{test.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onSubmit} disabled={selectedTests.length === 0} className="bg-blue-600 text-white hover:bg-blue-700">
            Send to Lab
          </Button>
        </div>
      </div>
    </div>
  );
}
