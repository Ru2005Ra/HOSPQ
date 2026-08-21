import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { useDb } from "@/lib/hooks";
import { db } from "@/lib/store";
import { Download } from "lucide-react";
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

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("HospiQ — Reception Queue Report", 14, 18);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [["#", tr("patient_col"), tr("department"), "Location", tr("insurance_col"), "Vitals"]],
      body: waiting.map(t => [
        `#${t.token}`,
        t.patientName,
        t.department || "—",
        locationFor(t.patientId),
        insuranceFor(t.patientId),
        vitalsFor(t.id),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 27, 61] },
    });
    doc.save(`hospiq-reception-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Report exported successfully");
  };

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
    const v = t.vitals ?? {};
    const weight = v.weight ?? "—";
    const temp = v.temperature ?? "—";
    const bp = v.bloodPressure ?? "—";
    return `W: ${weight}kg, T: ${temp}°C, BP: ${bp}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("reception_title")}</h1>
            <p className="mt-2 text-muted-foreground">{tr("reception_desc")}</p>
          </div>
          <Button onClick={exportPdf} variant="outline" className="border-accent text-accent hover:bg-accent/10"><Download className="mr-2 h-4 w-4" /> {tr("export_pdf")}</Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label={tr("in_queue")} value={waiting.length} />
          <Stat label={tr("avg_wait")} value={`${waiting.length * 5} min`} />
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
  const currentVitals = ticket?.vitals ?? {};
  const [weight, setWeight] = useState(currentVitals.weight ?? "");
  const [temperature, setTemperature] = useState(currentVitals.temperature ?? "");
  const [bloodPressure, setBloodPressure] = useState(currentVitals.bloodPressure ?? "");

  const save = () => {
    const cleanWeight = weight.trim();
    const cleanTemperature = temperature.trim();
    const cleanBp = bloodPressure.trim();

    if (cleanWeight) {
      const w = Number(cleanWeight);
      if (Number.isNaN(w) || w < 20 || w > 250) {
        toast.error("Weight should be between 20 kg and 250 kg.");
        return;
      }
    }

    if (cleanTemperature) {
      const t = Number(cleanTemperature);
      if (Number.isNaN(t) || t < 30 || t > 45) {
        toast.error("Temperature should be between 30°C and 45°C.");
        return;
      }
    }

    if (cleanBp) {
      const normalized = cleanBp.replace(/\s*mmHg\s*/i, "").trim();
      const matches = /^\d{2,3}\/\d{2,3}$/.test(normalized);
      if (!matches) {
        toast.error("BP should look like 120/80 or 140/90.");
        return;
      }
      const [sys, dia] = normalized.split("/").map(Number);
      if (Number.isNaN(sys) || Number.isNaN(dia) || sys < 60 || sys > 220 || dia < 30 || dia > 120) {
        toast.error("BP values should be realistic, for example 120/80.");
        return;
      }
    }

    db.updatePatientLocation(patientId, { province, district, sector, village });
    if (insurance) {
      const u = db.all().users.find((x: any) => x.id === patientId);
      if (u) u.insurance = insurance;
      writePatientInsurance(patientId, insurance);
    }
    if (ticket) {
      db.updateTicketVitals(ticketId, {
        weight: cleanWeight,
        temperature: cleanTemperature,
        bloodPressure: cleanBp,
      });
    }
    toast.success(tr("patient_updated"));
    onClose();
  };

  const writePatientInsurance = (id: string, value: string) => {
    const d = db.all();
    const u = d.users.find((x: any) => x.id === id);
    if (!u) return;
    u.insurance = value;
    localStorage.setItem("hospiq_v1", JSON.stringify(d));
    window.dispatchEvent(new Event("hospiq:change"));
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
          <input type="number" min={20} max={250} step="0.1" className={cls} placeholder={tr("weight")} value={weight} onChange={e => setWeight(e.target.value)} />
          <input type="number" min={30} max={45} step="0.1" className={cls} placeholder={tr("temp")} value={temperature} onChange={e => setTemperature(e.target.value)} />
          <input className={cls} placeholder="120/80 mmHg" value={bloodPressure} onChange={e => setBloodPressure(e.target.value)} />
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

