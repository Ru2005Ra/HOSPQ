import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { useDb } from "@/lib/hooks";
import { db } from "@/lib/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/reception")({
  head: () => ({ meta: [{ title: "Reception — HospiQ" }] }),
  component: () => (<RoleGuard role="reception"><Page /></RoleGuard>),
});

function Page() {
  const tr = useT();
  const queue = useDb((d) => d.queue ?? []);
  const waiting = queue.filter((t: any) => t.status === "waiting");
  const today = queue.filter((t: any) => t.createdAt > Date.now() - 24 * 3600 * 1000);
  const [modal, setModal] = useState<{ patientId: string; ticketId: string } | null>(null);
  const [emergency, setEmergency] = useState<{ ticketId: string; description: string } | null>(null);

  const locationFor = (patientId: string) => {
    const patient = db.all().users.find((u: any) => u.id === patientId);
    if (!patient || !patient.province) return "Not set";
    return `${patient.province}, ${patient.district}, ${patient.sector}, ${patient.village}`;
  };

  const insuranceFor = (patientId: string) => {
    const patient = db.all().users.find((u: any) => u.id === patientId);
    return patient?.insurance || "Not set";
  };

  const vitalsFor = (ticketId: string) => {
    const t = db.all().queue.find((x: any) => x.id === ticketId);
    if (!t) return "-";
    return `W: ${t.vitals.weight}kg, T: ${t.vitals.temperature}°C, BP: ${t.vitals.bloodPressure}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("reception_title")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("reception_desc")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label={tr("in_queue")} value={waiting.length} />
          <Stat label={tr("avg_wait")} value={`${waiting.length * 3} min`} />
          <Stat label={tr("today_total")} value={today.length} />
        </div>

        <h2 className="mt-10 text-lg font-semibold text-foreground">{tr("waiting_list")}</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-muted-foreground">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">{tr("patient_col")}</th>
                <th className="p-3">{tr("department")}</th>
                <th className="p-3">{tr("location_col")}</th>
                <th className="p-3">{tr("insurance_col")}</th>
                <th className="p-3">{tr("vitals_col")}</th>
                <th className="p-3">{tr("actions_col")}</th>
              </tr>
            </thead>
            <tbody>
              {waiting.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">{tr("no_waiting")}</td></tr>}
              {waiting.map((t: any) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 font-semibold text-primary">#{t.token}</td>
                  <td className="p-3">{t.patientName}</td>
                  <td className="p-3 text-muted-foreground">{t.department}</td>
                  <td className="p-3 text-muted-foreground text-xs">{locationFor(t.patientId)}</td>
                  <td className="p-3 text-muted-foreground text-xs">{insuranceFor(t.patientId)}</td>
                  <td className="p-3 text-muted-foreground text-xs">{vitalsFor(t.id)}</td>
                  <td className="p-3 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setModal({ patientId: t.patientId, ticketId: t.id })}>{tr("edit_info")}</Button>
                    <Button size="sm" variant="outline" onClick={() => setEmergency({ ticketId: t.id, description: "" })}>{tr("triage")}</Button>
                    <Button size="sm" variant="outline" onClick={() => { db.removeTicket(t.id); toast.success(tr("token_removed")); }}>{tr("remove")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modal && <EditModal {...modal} onClose={() => setModal(null)} />}
        {emergency && <EmergencyModal {...emergency} onClose={() => setEmergency(null)} />}
      </main>
    </div>
  );
}

function EditModal({ patientId, ticketId, onClose }: { patientId: string; ticketId: string; onClose: () => void }) {
  const tr = useT();
  const patient = db.all().users.find((u: any) => u.id === patientId);
  const ticket = db.all().queue.find((t: any) => t.id === ticketId);
  const [province, setProvince] = useState(patient?.province || "");
  const [district, setDistrict] = useState(patient?.district || "");
  const [sector, setSector] = useState(patient?.sector || "");
  const [village, setVillage] = useState(patient?.village || "");
  const [insurance, setInsurance] = useState(patient?.insurance || "");
  const [weight, setWeight] = useState(ticket?.vitals.weight || "");
  const [temperature, setTemperature] = useState(ticket?.vitals.temperature || "");
  const [bloodPressure, setBloodPressure] = useState(ticket?.vitals.bloodPressure || "");

  const save = () => {
    db.updatePatientLocation(patientId, { province, district, sector, village });
    if (insurance) { const u = db.all().users.find((x: any) => x.id === patientId); if (u) u.insurance = insurance; }
    if (ticket) ticket.vitals = { weight, temperature, bloodPressure };
    toast.success(tr("patient_updated"));
    onClose();
  };

  const cls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">{tr("edit_patient")}</h2>
        <div className="grid gap-3">
          <input className={cls} placeholder={tr("province")} value={province} onChange={e => setProvince(e.target.value)} />
          <input className={cls} placeholder={tr("district")} value={district} onChange={e => setDistrict(e.target.value)} />
          <input className={cls} placeholder={tr("sector")} value={sector} onChange={e => setSector(e.target.value)} />
          <input className={cls} placeholder={tr("village")} value={village} onChange={e => setVillage(e.target.value)} />
          <input className={cls} placeholder={tr("insurance_col")} value={insurance} onChange={e => setInsurance(e.target.value)} />
          <input className={cls} placeholder={tr("weight")} value={weight} onChange={e => setWeight(e.target.value)} />
          <input className={cls} placeholder={tr("temp")} value={temperature} onChange={e => setTemperature(e.target.value)} />
          <input className={cls} placeholder={tr("bp")} value={bloodPressure} onChange={e => setBloodPressure(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>{tr("cancel")}</Button>
          <Button size="sm" onClick={save}>{tr("save")}</Button>
        </div>
      </div>
    </div>
  );
}

function EmergencyModal({ ticketId, description: desc, onClose }: { ticketId: string; description: string; onClose: () => void }) {
  const tr = useT();
  const [description, setDescription] = useState(desc);
  const mark = () => {
    db.markEmergency(ticketId, description);
    toast.success(tr("emergency_sent"));
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">{tr("emergency_title")}</h2>
        <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" placeholder={tr("emergency_placeholder")} value={description} onChange={e => setDescription(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>{tr("cancel")}</Button>
          <Button size="sm" onClick={mark} disabled={!description.trim()}>{tr("send_emergency")}</Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
