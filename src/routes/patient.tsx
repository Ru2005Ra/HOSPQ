import React, { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useDb, fmtDuration, fmtDurationWithSeconds } from "@/lib/hooks";
import { calculatePatientPayable, db, DEPARTMENTS, hasCompleteVitals, type QueueTicket } from "@/lib/store";
import { getProvinces, getDistricts, getSectors, getVillages } from "@/lib/locations";
import { Clock3, Pill, Receipt, MapPin, CheckCheck, X, Loader2, CircleUserRound } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [{ title: "Patient — HospiQ" }] }),
  component: PatientHome,
});

const INSURERS = ["Mutuelle de Santé", "MMI", "RSSB", "RAMA", "Radiant", "Other / Cash"];

const NEARBY_PHARMACIES = [
  { name: "Kigali Health Pharmacy", province: "Kigali", district: "Gasabo", sector: "Kimironko", address: "KG 14 Ave, Kimironko", phone: "+250 788 123 456" },
  { name: "Horizon Pharmacy", province: "Kigali", district: "Nyarugenge", sector: "Nyamirambo", address: "KK 23 St, Nyamirambo", phone: "+250 732 234 567" },
  { name: "Umurinzi Pharmacy", province: "Kigali", district: "Kicukiro", sector: "Gahanga", address: "KG 26 Ave, Gahanga", phone: "+250 783 345 678" },
  { name: "Ruhanga Pharmacy", province: "Kigali", district: "Gasabo", sector: "Gacurabwenge", address: "KG 8 St, Gacurabwenge", phone: "+250 729 456 789" },
  { name: "Umwiza Pharmacy", province: "Eastern", district: "Rwamagana", sector: "Mukarange", address: "RN 3, Mukarange", phone: "+250 789 567 890" },
];

function PatientHome() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const tr = useT();
  const ticket = useDb((d) => (user ? d.queue?.find((t: any) => t.patientId === user.id && t.status !== "done" && t.status !== "removed") ?? null : null));
  const emergencyNotice = useDb((d) => d.emergencyAlert ?? null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [showPatientVisual, setShowPatientVisual] = useState(false);
  const vitalsPending = !!ticket && !hasCompleteVitals(ticket.vitals);

  useEffect(() => {
    if (ready && (!user || user.role !== "patient")) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  useEffect(() => {
    db.pruneExpiredWaitingTickets();
  }, []);

  useEffect(() => {
    if (!ticket) { setLastStatus(null); return; }
    if (ticket.status === lastStatus) return;
    setLastStatus(ticket.status);
    const room = DEPARTMENTS.find(d => d.code === ticket.departmentCode)?.room ?? "consultation room";
    const doctorName = ticket.assignedDoctorName ? `Dr. ${ticket.assignedDoctorName}` : "the selected doctor";
    if (ticket.status === "waiting") toast(`✅ ${tr("token_ready", { token: ticket.token })}`);
    if (ticket.status === "with-doctor") toast(`🩺 ${tr("doctor_ready", { doctor: doctorName, room })}`);
    if (ticket.status === "paying") toast(`💳 ${tr("consultation_done")}`);
    if (ticket.status === "pharmacy") toast(`💊 ${tr("collect_medicines")}`);
    if (ticket.status === "done") toast(`🎉 ${tr("visit_complete")}`);
    if (emergencyNotice && emergencyNotice.departmentCode === ticket.departmentCode && emergencyNotice.active) {
      toast(`⚠ ${tr("emergency_case_wait")}`);
    }
  }, [ticket, lastStatus, emergencyNotice]);

  useEffect(() => {
    if (!ticket || ticket.status !== "waiting") return;
    const timer = window.setInterval(() => {
      db.pruneExpiredWaitingTickets();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [ticket]);

  if (!user || user.role !== "patient") return null;

  const emergencyForDepartment = !!(emergencyNotice && emergencyNotice.departmentCode === ticket?.departmentCode && emergencyNotice.active);
  const roomMessage = ticket && ticket.assignedDoctorName && ticket.status === "waiting"
    ? tr("assigned_doctor", { doctor: ticket.assignedDoctorName, room: DEPARTMENTS.find(d => d.code === ticket.departmentCode)?.room ?? "consultation room" })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="patient-dashboard-layout">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("hi")} {user.firstName} 👋</h1>
            <p className="mt-2 text-muted-foreground">{tr("manage_visit")}</p>
          </div>
          {showPatientVisual && (
            <div className="patient-visual" aria-hidden="true">
              <div className="patient-visual__glow" />
              <div className="patient-visual__icon">
                <CircleUserRound className="h-24 w-24" strokeWidth={1.35} />
                <span className="patient-visual__smile" />
              </div>
              <span className="patient-visual__ring patient-visual__ring--one" />
              <span className="patient-visual__ring patient-visual__ring--two" />
            </div>
          )}
          <div className="patient-dashboard-content">
        {vitalsPending && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            {tr("vitals_required")}
          </div>
        )}
        {emergencyForDepartment && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
            {tr("emergency_active")}
          </div>
        )}
        {roomMessage && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            {roomMessage}
          </div>
        )}
            {!ticket && <StartVisit onVisitStarted={() => setShowPatientVisual(true)} />}
            {ticket && <ActiveVisit ticket={ticket} />}
          </div>
        </div>
      </main>
    </div>
  );
}

function StartVisit({ onVisitStarted }: { onVisitStarted: () => void }) {
  const { user } = useAuth();
  const tr = useT();
  const [step, setStep] = useState<"choice" | "location" | "dept">("choice");
  const [location, setLocation] = useState({ province: "", district: "", sector: "", cell: "" });

  const availableDepts = DEPARTMENTS.filter(d => {
    if (d.code === "MH") return false;
    if (d.code === "MA" && user?.sex === "male") return false;
    return true;
  });
  const [departmentCode, setDepartmentCode] = useState(availableDepts[0].code);
  const [insurance, setInsurance] = useState(user?.insurance ?? INSURERS[0]);

  const submitLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.province || !location.district || !location.sector)
      return toast.error(tr("location_required"));
    setStep("dept");
  };

  const submitToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    db.updatePatientLocation(user.id, { province: location.province, district: location.district, sector: location.sector, village: location.cell });
    const t = db.enqueue(user, departmentCode, insurance, {});
    const pos = db.all().queue.filter((x: any) => x.departmentCode === departmentCode && x.status === "waiting").length;
    const waitMin = pos * 5;
    toast.success(tr("token_wait", { token: t.token, minutes: waitMin }));
    onVisitStarted();
  };

  if (step === "choice") return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <button onClick={() => setStep("location")} className="rounded-xl border-2 border-accent bg-card p-6 text-left shadow-[var(--shadow-card)] transition hover:bg-accent/5">
        <h3 className="text-lg font-semibold text-foreground">{tr("new_patient_btn")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{tr("new_patient_desc")}</p>
      </button>
      <button onClick={() => setStep("location")} className="rounded-xl border border-border bg-card p-6 text-left shadow-[var(--shadow-card)] transition hover:bg-secondary">
        <h3 className="text-lg font-semibold text-foreground">{tr("returning")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{tr("returning_desc")}</p>
      </button>
    </div>
  );

  if (step === "location") return (
    <form onSubmit={submitLocation} className="mt-8 rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-secondary">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">{tr("location_title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{tr("location_desc")}</p>
      </div>

      {/* Content */}
      <div className="p-6 grid gap-5">
        <div className="grid grid-cols-3 gap-4">
          {/* Province */}
          <div>
            <Label className="text-sm font-semibold text-foreground">{tr("province")} <span className="text-accent">*</span></Label>
            <select
              required
              value={location.province}
              onChange={e => {
                const prov = e.target.value;
                setLocation({ province: prov, district: "", sector: "", cell: "" });
              }}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">{tr("select_province")}</option>
              {getProvinces().map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* District */}
          <div>
            <Label className="text-sm font-semibold text-foreground">{tr("district")} <span className="text-accent">*</span></Label>
            <select
              required
              disabled={!location.province}
              value={location.district}
              onChange={e => {
                const dist = e.target.value;
                setLocation({ ...location, district: dist, sector: "", cell: "" });
              }}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{tr("select_district")}</option>
              {location.province && getDistricts(location.province).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Sector/Village */}
          <div>
            <Label className="text-sm font-semibold text-foreground">{tr("village")} <span className="text-accent">*</span></Label>
            <select
              required
              disabled={!location.district}
              value={location.sector}
              onChange={e => {
                const sect = e.target.value;
                setLocation({ ...location, sector: sect, cell: "" });
              }}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{tr("select_village")}</option>
              {location.province && location.district && getSectors(location.province, location.district).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Cell/Sector (if needed) */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("cell_sector_detail")}</Label>
          <select
            value={location.cell}
            onChange={e => setLocation({ ...location, cell: e.target.value })}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">{tr("select_cell")}</option>
            {location.province && location.district && location.sector && getVillages(location.province, location.district, location.sector).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-secondary flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep("choice")}>{tr("cancel")}</Button>
        <Button 
          type="submit" 
          disabled={!location.province || !location.district || !location.sector}
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
        >
          {tr("next")} →
        </Button>
      </div>
    </form>
  );

  return (
    <form onSubmit={submitToken} className="mt-8 grid gap-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-xl font-semibold text-foreground">{tr("choose_dept")}</h2>
      <div>
        <Label>{tr("department")}</Label>
        <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={departmentCode} onChange={e => setDepartmentCode(e.target.value)}>
          {availableDepts.map(d => <option key={d.code} value={d.code}>{d.name} — {d.description}</option>)}
        </select>
      </div>
      <div>
        <Label>{tr("insurance")}</Label>
        <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={insurance} onChange={e => setInsurance(e.target.value)}>
          {INSURERS.map(i => <option key={i}>{i}</option>)}
        </select>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep("location")}>{tr("cancel")}</Button>
        <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">{tr("get_my_token")}</Button>
      </div>
    </form>
  );
}

function ActiveVisit({ ticket }: { ticket: QueueTicket }) {
  return (
    <div className="mt-8 grid gap-6">
      <TokenCard ticket={ticket} />
      <VisitStagesTable ticket={ticket} />
      {ticket.status === "paying" && <PaymentPanel ticketId={ticket.id} />}
      {ticket.status === "pharmacy" && <PharmacyPanel ticket={ticket} />}
    </div>
  );
}

function TokenCard({ ticket }: { ticket: QueueTicket }) {
  const tr = useT();
  const ahead = useDb((d) => {
    const t = d.queue?.find((x: any) => x.id === ticket?.id);
    if (!t) return 0;
    return d.queue?.filter((x: any) => x.status === "waiting" && x.createdAt < t.createdAt).length ?? 0;
  });
  const emergencyNotice = useDb((d) => d.emergencyAlert ?? null);
  const waitMs = ahead * 5 * 60 * 1000;
  const [now, setNow] = useState(Date.now());
  const emergencyPause = !!(emergencyNotice && emergencyNotice.departmentCode === ticket.departmentCode && emergencyNotice.active);
  useEffect(() => {
    if (emergencyPause) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [emergencyPause]);
  const deadline = useMemo(() => ticket.createdAt + waitMs, [ticket.createdAt, waitMs]);
  const remaining = Math.max(0, deadline - now);
  const green = remaining >= 5 * 60 * 1000;
  const estimatedWaitMin = ahead * 5;

  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">{tr("your_token")}</p>
      <p className="mt-2 text-7xl font-bold text-primary">#{ticket.token}</p>
      <p className="mt-3 text-sm text-muted-foreground">{tr("dept")} {ticket.department}</p>
      {ticket.status === "waiting" && (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {ahead} {ahead === 1 ? tr("person_ahead") : tr("people_ahead")}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground">
            <Clock3 className="h-4 w-4 text-accent" />
            {tr("estimated_wait")} <span className="text-accent">{estimatedWaitMin} min</span>
          </div>
          {ahead > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ml-2"
              style={{ background: green ? "color-mix(in oklab, var(--success) 15%, transparent)" : "color-mix(in oklab, var(--destructive) 15%, transparent)", color: green ? "var(--success)" : "var(--destructive)" }}>
              <Clock3 className="h-4 w-4" /> <span className="font-mono font-bold">{emergencyPause ? tr("paused") : fmtDurationWithSeconds(remaining)}</span> {emergencyPause ? tr("emergency_pause") : (green ? tr("you_have_time") : tr("stay_nearby"))}
            </div>
          )}
          {ahead === 0 && <p className="mt-3 text-sm font-semibold text-destructive">{emergencyPause ? tr("emergency_pause_wait") : tr("stay_close")}</p>}
        </>
      )}
    </div>
  );
}




function VisitStagesTable({ ticket }: { ticket: QueueTicket }) {
  const tr = useT();
  const stages = [
    // Reception is considered done once the patient leaves the waiting queue.
    { name: tr("reception_stage"), desc: tr("reception_stage_desc"), done: ticket.status !== "waiting", active: ticket.status === "waiting" },
    // Doctor is active during consultation.
    { name: tr("doctor_stage"), desc: tr("doctor_stage_desc"), done: ["paying", "pharmacy", "done"].includes(ticket.status), active: ticket.status === "with-doctor" },
    // Laboratory isn't a real status in the queue right now, so we mark it as:
    // - pending while waiting/with-doctor
    // - done once the workflow reaches payment or beyond.
    { name: tr("laboratory_stage"), desc: tr("laboratory_stage_desc"), done: ["paying", "pharmacy", "done"].includes(ticket.status), active: false },
    { name: tr("payment_stage"), desc: tr("payment_stage_desc"), done: ["pharmacy", "done"].includes(ticket.status), active: ticket.status === "paying" },
    { name: tr("pharmacy_stage"), desc: tr("pharmacy_stage_desc"), done: ticket.status === "done", active: ticket.status === "pharmacy" },
  ];


  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">{tr("visit_progress")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{tr("visit_progress_desc")}</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left text-muted-foreground">
          <tr>
            <th className="p-3">{tr("step")}</th>
            <th className="p-3">{tr("stage")}</th>
            <th className="p-3">{tr("description")}</th>
            <th className="p-3 text-center">{tr("status")}</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s, i) => (
            <tr key={s.name} className={`border-t border-border ${s.active ? "bg-accent/5" : ""}`}>
              <td className="p-3 font-bold text-muted-foreground">{i + 1}</td>
              <td className="p-3 font-semibold text-foreground">{s.name}</td>
              <td className="p-3 text-muted-foreground text-xs">{s.desc}</td>
              <td className="p-3 text-center">
                {s.done ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    <CheckCheck className="h-3 w-3" /> {tr("done")}
                  </span>
                ) : s.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    <Loader2 className="h-3 w-3 animate-spin" /> {tr("in_progress")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    <X className="h-3 w-3" /> {tr("pending")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentPanel({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const tr = useT();
  const ticket = useDb((d) => d.queue?.find((t: any) => t.id === ticketId) ?? null);
  const [phone, setPhone] = useState(user?.phone?.replace("+250", "") ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "cash">("mobile");

  if (!ticket) return null;
  const total = (ticket.prescription ?? []).reduce((s: number, p: any) => s + (p.transfer ? 0 : p.price * p.qty), 0);
  const patientPayable = calculatePatientPayable(total, ticket.insurance ?? user?.insurance);
  const hasTransfer = (ticket.prescription ?? []).some((p: any) => p.transfer);

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "mobile") {
      if (`+250${phone}` !== user?.phone) return toast.error(tr("phone_mismatch"));
    }
    db.recordPayment(ticketId, patientPayable, paymentMethod);
    toast.success(tr("payment_confirmed", { amount: patientPayable, method: paymentMethod === "mobile" ? tr("mobile_money") : tr("cash") }));
  };

  return (
    <div className="grid gap-6">
      {/* Prescription Summary Card */}
      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-accent" />
            <h2 className="font-semibold text-foreground">{tr("prescription_summary")}</h2>
          </div>
        </div>
        <div className="p-6">
          {(ticket.prescription ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr("no_medicines")}</p>
          ) : (
            <>
              <div className="space-y-3">
                {(ticket.prescription ?? []).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center pb-3" style={{ borderBottom: i < (ticket.prescription ?? []).length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {p.name} {p.qty > 1 ? `× ${p.qty}` : ""}
                      </p>
                      {p.transfer && (
                        <span className="inline-block mt-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                          {tr("buy_outside_short")}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground ml-4">
                      {p.transfer ? "—" : `${(p.price * p.qty).toLocaleString()} RWF`}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Total Section */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">{tr("total_label")}</span>
                  <span className="text-lg font-bold text-accent">{patientPayable.toLocaleString()} RWF</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pay by Mobile Money / Cash Card */}
      {total > 0 && (
        <form onSubmit={pay} className="rounded-xl border-2 border-accent bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💳</span>
            <h3 className="text-lg font-semibold text-foreground">{tr("pay_mobile")}</h3>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <label className={`rounded-lg border p-3 cursor-pointer ${paymentMethod === "mobile" ? "border-accent bg-accent/5" : "border-border bg-secondary"}`}>
              <input type="radio" name="paymentMethod" checked={paymentMethod === "mobile"} onChange={() => setPaymentMethod("mobile")} className="mr-2" />
              {tr("mobile_money")}
            </label>
            <label className={`rounded-lg border p-3 cursor-pointer ${paymentMethod === "cash" ? "border-accent bg-accent/5" : "border-border bg-secondary"}`}>
              <input type="radio" name="paymentMethod" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="mr-2" />
              {tr("cash_at_pharmacy")}
            </label>
          </div>

          {paymentMethod === "mobile" && (
            <>
              <p className="text-sm text-muted-foreground mb-5">
                {tr("enter_phone_payment", { amount: patientPayable })}
              </p>
              <div className="flex gap-2 mb-4">
                <div className="flex items-center rounded-md border border-input bg-secondary px-3 text-sm font-medium text-foreground whitespace-nowrap">
                  +250
                </div>
                <Input
                  required
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="78xxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1"
                />
              </div>
            </>
          )}

          {paymentMethod === "cash" && (
            <p className="text-sm text-muted-foreground mb-5">
              {tr("cash_payment_note", { amount: patientPayable })}
            </p>
          )}

          <div className="flex items-start gap-3 mb-5">
            <input
              type="checkbox"
              id="confirm-pay"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-1 accent-accent cursor-pointer"
            />
            <label htmlFor="confirm-pay" className="text-sm text-foreground cursor-pointer">
              {tr("confirm_payment", { amount: patientPayable })}
            </label>
          </div>

          <Button
            type="submit"
            disabled={!confirmed || (paymentMethod === "mobile" && phone.length !== 9)}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 font-semibold py-2"
          >
            {paymentMethod === "cash" ? `Confirm cash payment of ${patientPayable.toLocaleString()} RWF` : `Pay ${patientPayable.toLocaleString()} RWF`}
          </Button>
        </form>
      )}

      {total === 0 && (
        <Button onClick={() => db.recordPayment(ticketId, 0, "cash")} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {tr("proceed_pharmacy")}
        </Button>
      )}
    </div>
  );
}

function PharmacyPanel({ ticket }: { ticket: QueueTicket }) {
  const tr = useT();
  const { user } = useAuth();
  const transferItems = (ticket.prescription ?? []).filter(p => p.transfer);
  const locationKey = [user?.province, user?.district, user?.sector].filter((v): v is string => Boolean(v)).map(v => v.toLowerCase());
  const nearby = NEARBY_PHARMACIES.filter(ph => locationKey.some(key => [ph.province, ph.district, ph.sector].map(v => v.toLowerCase()).includes(key)));
  const shownPharmacies = nearby.length > 0 ? nearby : NEARBY_PHARMACIES;

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
      <div className="text-center mb-6">
        <Pill className="mx-auto h-10 w-10 text-accent" />
        <h2 className="mt-3 text-xl font-semibold text-foreground">{tr("head_pharmacy")}</h2>
      </div>

      {transferItems.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {shownPharmacies.map((ph) => (
              <div key={ph.name} className="rounded-xl border border-border bg-secondary p-4">
                <h3 className="font-semibold text-foreground">{ph.name}</h3>
                <p className="text-xs text-muted-foreground">{ph.address}</p>
                <p className="text-xs text-muted-foreground">{ph.province}, {ph.district}, {ph.sector}</p>
                <p className="mt-2 text-sm">Phone: <strong>{ph.phone}</strong></p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          All prescribed medicines are available at the hospital pharmacy. Please proceed to the counter.
        </div>
      )}
    </div>
  );
}
