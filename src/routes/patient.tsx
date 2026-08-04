import React, { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useDb, fmtDuration } from "@/lib/hooks";
import { db, DEPARTMENTS, type QueueTicket } from "@/lib/store";
import { Clock3, Pill, Receipt, ShieldPlus, MapPin, CheckCheck, X, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [{ title: "Patient — HospiQ" }] }),
  component: PatientHome,
});

const INSURERS = ["Mutuelle de Santé", "MMI", "RSSB", "RAMA", "Radiant", "Other / Cash"];

const FIRST_AID_TIPS = [
  { icon: "💧", tip: "Stay hydrated — drink water while you wait." },
  { icon: "🧘", tip: "Stay calm and seated. Stress can raise blood pressure." },
  { icon: "🚫", tip: "Do not eat heavy meals before seeing the doctor." },
  { icon: "📋", tip: "Prepare to describe your symptoms clearly to the doctor." },
  { icon: "💊", tip: "If you take regular medication, have the names ready." },
  { icon: "🩺", tip: "Note when your symptoms started and how severe they are." },
];

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
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [lastDept, setLastDept] = useState<string | null>(null);

  useEffect(() => {
    if (ready && (!user || user.role !== "patient")) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!ticket) { setLastStatus(null); setLastDept(null); return; }
    if (ticket.status === lastStatus && ticket.departmentCode === lastDept) return;

    const room = ticket.room ?? DEPARTMENTS.find(d => d.code === ticket.departmentCode)?.room ?? "consultation room";

    // Emergency was just assigned
    if (ticket.departmentCode === "MH" && ticket.status !== "done" && lastDept !== "MH") {
      toast.error(`🚨 ${tr("emergency_alert_active")} ${room}`);
    }

    // Emergency previously active but now resolved
    if (lastDept === "MH" && ticket.status === "done") {
      toast.success(tr("emergency_alert_resolved"));
    }

    if (ticket.status === "waiting") toast(`✅ Token ${ticket.token} ready — head to reception desk.`);
    if (ticket.status === "with-doctor") toast(`🩺 Doctor is ready. Please go to ${room}.`);
    if (ticket.status === "paying") toast(`💳 Consultation done. Please pay at the cashier.`);
    if (ticket.status === "pharmacy") toast(`💊 Go to pharmacy to collect your medicines.`);
    if (ticket.status === "done") toast(`🎉 Visit complete. Thank you for using HospiQ!`);

    setLastStatus(ticket.status);
    setLastDept(ticket.departmentCode);
  }, [ticket, lastStatus, lastDept, tr]);

  if (!user || user.role !== "patient") return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("hi")} {user.firstName} 👋</h1>
        <p className="mt-2 text-muted-foreground">{tr("manage_visit")}</p>

        {ticket && ticket.departmentCode === "MH" && ticket.status !== "done" && (
          <div className="mt-4 rounded-xl border border-destructive bg-red-50 p-4 text-sm text-destructive">
            <strong>{tr("emergency_alert_active")}</strong>
            <p className="mt-1 text-xs text-muted-foreground">{tr("go_to_room")} {ticket.room ?? DEPARTMENTS.find(d => d.code === ticket.departmentCode)?.room}</p>
          </div>
        )}

        {ticket && lastDept === "MH" && ticket.status === "done" && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <strong>{tr("emergency_alert_resolved")}</strong>
          </div>
        )}

        {!ticket && <StartVisit />}
        {ticket && <ActiveVisit ticket={ticket} />}
      </main>
    </div>
  );
}

function StartVisit() {
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
    if (!location.province || !location.district || !location.sector || !location.cell)
      return toast.error("Please fill in all location fields");
    setStep("dept");
  };

  const submitToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    db.updatePatientLocation(user.id, { province: location.province, district: location.district, sector: location.sector, village: location.cell });
    const t = db.enqueue(user, departmentCode, insurance, {});
    const pos = db.all().queue.filter((x: any) => x.departmentCode === departmentCode && x.status === "waiting").length;
    const waitMin = pos * 3;
    toast.success(`Token #${t.token} — estimated wait: ${waitMin} min`);
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
    <form onSubmit={submitLocation} className="mt-8 grid gap-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-semibold text-foreground">Your Location</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">This helps us identify you correctly. Please fill in all fields.</p>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{tr("province")}</Label><Input required placeholder="e.g. Kigali" value={location.province} onChange={e => setLocation({ ...location, province: e.target.value })} /></div>
        <div><Label>{tr("district")}</Label><Input required placeholder="e.g. Gasabo" value={location.district} onChange={e => setLocation({ ...location, district: e.target.value })} /></div>
        <div><Label>{tr("sector")}</Label><Input required placeholder="e.g. Kimironko" value={location.sector} onChange={e => setLocation({ ...location, sector: e.target.value })} /></div>
        <div><Label>Cell</Label><Input required placeholder="e.g. Bibare" value={location.cell} onChange={e => setLocation({ ...location, cell: e.target.value })} /></div>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep("choice")}>{tr("cancel")}</Button>
        <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">Next →</Button>
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
  const waitMs = ahead * 3 * 60 * 1000;
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const deadline = useMemo(() => ticket.createdAt + waitMs, [ticket.createdAt, waitMs]);
  const remaining = Math.max(0, deadline - now);
  const green = remaining >= 3 * 60 * 1000;
  const estimatedWaitMin = ahead * 3;

  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">{tr("your_token")}</p>
      <p className="mt-2 text-7xl font-bold text-primary">#{ticket.token}</p>
      <p className="mt-3 text-sm text-muted-foreground">{tr("dept")} {ticket.department}</p>
      <p className="mt-1 text-sm text-muted-foreground">{tr("room")} {ticket.room ?? DEPARTMENTS.find(d => d.code === ticket.departmentCode)?.room ?? tr("unknown_room")}</p>
      {ticket.status === "waiting" && (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {ahead} {ahead === 1 ? tr("person_ahead") : tr("people_ahead")}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground">
            <Clock3 className="h-4 w-4 text-accent" />
            Estimated wait: <span className="text-accent">{estimatedWaitMin} min</span>
          </div>
          {ahead > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ml-2"
              style={{ background: green ? "color-mix(in oklab, var(--success) 15%, transparent)" : "color-mix(in oklab, var(--destructive) 15%, transparent)", color: green ? "var(--success)" : "var(--destructive)" }}>
              <Clock3 className="h-4 w-4" /> {fmtDuration(remaining)} {green ? tr("you_have_time") : tr("stay_nearby")}
            </div>
          )}
          {ahead === 0 && <p className="mt-3 text-sm font-semibold text-destructive">{tr("stay_close")}</p>}
        </>
      )}
    </div>
  );
}

function StatusMessage({ ticket }: { ticket: QueueTicket }) {
  const messages: Record<string, { before: string; after: string; color: string }> = {
    waiting: {
      before: "📍 You are currently waiting. Please stay near the reception desk and listen for your token number to be called.",
      after: "✅ Once reception calls your token, they will record your vitals and confirm your insurance. Then you will be sent to the doctor.",
      color: "border-blue-200 bg-blue-50 text-blue-800",
    },
    "with-doctor": {
      before: "🩺 You are now with the doctor. Please describe your symptoms clearly and honestly.",
      after: "✅ After the consultation, the doctor will write your diagnosis and prescription. You will then proceed to payment.",
      color: "border-green-200 bg-green-50 text-green-800",
    },
    paying: {
      before: "💳 Your consultation is complete. Please pay for your medicines below.",
      after: "✅ After payment, go to the pharmacy counter with your token to collect your medicines.",
      color: "border-yellow-200 bg-yellow-50 text-yellow-800",
    },
    pharmacy: {
      before: "💊 Head to the pharmacy counter and show your token number to collect your medicines.",
      after: "✅ Once you receive your medicines, your visit will be marked as complete. Feel better soon!",
      color: "border-purple-200 bg-purple-50 text-purple-800",
    },
  };

  const msg = messages[ticket.status];
  if (!msg) return null;

  return (
    <div className={`rounded-xl border p-4 text-sm ${msg.color}`}>
      <p className="font-semibold">{msg.before}</p>
      <p className="mt-2 opacity-80">{msg.after}</p>
    </div>
  );
}

function FirstAidTips() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 mb-4">
        <ShieldPlus className="h-5 w-5 text-accent" />
        <h2 className="text-base font-semibold text-foreground">While You Wait — First Aid Tips</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {FIRST_AID_TIPS.map((t, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
            <span className="text-base">{t.icon}</span>
            <span>{t.tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisitStagesTable({ ticket }: { ticket: QueueTicket }) {
  const receptionDone = ticket.readyForDoctor || ticket.status !== "waiting";
  const receptionActive = ticket.status === "waiting" && !ticket.readyForDoctor;

  const isAtLab = ticket.departmentCode === "LB";
  const labDone = ["paying", "pharmacy", "done"].includes(ticket.status);
  const labActive = isAtLab && ticket.status === "waiting";

  const stages = [
    // Reception is considered done once the patient is marked as readyForDoctor OR leaves the waiting queue.
    { name: "Reception", desc: "Registration, vitals & insurance", done: receptionDone, active: receptionActive },
    // Doctor is active during consultation. Done once sent to lab or beyond.
    { name: "Doctor", desc: "Consultation & diagnosis", done: isAtLab || ["paying", "pharmacy", "done"].includes(ticket.status), active: ticket.status === "with-doctor" },
    // Laboratory is active when patient is at lab. Done once moved to payment or beyond. Cannot return from lab.
    { name: "Laboratory", desc: "Lab tests (if required)", done: labDone, active: labActive },
    { name: "Payment", desc: "Pay at cashier", done: ["pharmacy", "done"].includes(ticket.status), active: ticket.status === "paying" },
    { name: "Pharmacy", desc: "Collect medicines", done: ticket.status === "done", active: ticket.status === "pharmacy" },
  ];


  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Visit Progress — Step by Step</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Follow each stage of your hospital visit</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left text-muted-foreground">
          <tr>
            <th className="p-3">Step</th>
            <th className="p-3">Stage</th>
            <th className="p-3">Description</th>
            <th className="p-3 text-center">Status</th>
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
                    <CheckCheck className="h-3 w-3" /> Done
                  </span>
                ) : s.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    <Loader2 className="h-3 w-3 animate-spin" /> In progress
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    <X className="h-3 w-3" /> Pending
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
  const [verifying, setVerifying] = useState(false);

  if (!ticket) return null;
  const total = (ticket.prescription ?? []).reduce((s: number, p: any) => s + (p.transfer ? 0 : p.price * p.qty), 0);
  const hasTransfer = (ticket.prescription ?? []).some((p: any) => p.transfer);
  const paymentRequest = ticket.paymentRequest;
  const isPending = paymentRequest?.status === "pending";
  const isPaid = ticket.paid || paymentRequest?.status === "success";
  const isFailed = paymentRequest?.status === "failed";

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    const full = `+250${phone}`;
    if (full !== user?.phone) return toast.error(tr("phone_mismatch"));
    const reqId = db.createPaymentRequest(ticketId, full, total, "mock");
    if (!reqId) return toast.error("Could not create payment request.");
    toast.info(tr("payment_requested"));
  };

  const checkPayment = () => {
    if (!ticket?.paymentRequest) return;
    setVerifying(true);
    try {
      const res = db.verifyPayment(ticket.paymentRequest.requestId);
      if (res?.ok) {
        toast.success(tr("payment_confirmed"));
      } else {
        toast.error(tr("payment_failed"));
      }
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!paymentRequest || paymentRequest.status !== "pending") return;
    const interval = window.setInterval(() => {
      if (!ticket?.paymentRequest || ticket.paymentRequest.status !== "pending") return;
      const res = db.verifyPayment(ticket.paymentRequest.requestId);
      if (res?.ok) {
        toast.success(tr("payment_confirmed"));
      } else if (res) {
        toast.error(tr("payment_failed"));
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [paymentRequest?.requestId, paymentRequest?.status, ticket, tr]);

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">{tr("prescription_summary")}</h2>
        </div>
        {(ticket.prescription ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No medicines prescribed.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {(ticket.prescription ?? []).map((p: any, i: number) => (
              <li key={i} className="flex justify-between py-2">
                <span className="flex-1">
                  {p.name} × {p.qty}
                  {p.transfer && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">Buy outside</span>}
                </span>
                <span className="font-medium">{p.transfer ? "—" : `${(p.price * p.qty).toLocaleString()} RWF`}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-between border-t border-border pt-3 text-base font-bold">
          <span>{tr("total")}</span>
          <span className="text-accent">{total.toLocaleString()} RWF</span>
        </div>
        {hasTransfer && (
          <p className="mt-3 rounded-md bg-orange-50 border border-orange-200 p-2 text-xs text-orange-700">
            ⚠️ Some medicines are out of stock and must be purchased at an outside pharmacy.
          </p>
        )}
        {total === 0 && (
          <p className="mt-3 rounded-md bg-green-50 border border-green-200 p-2 text-xs text-green-700">
            ✅ No payment required — all medicines are transfer items.
          </p>
        )}
      </div>

      {total > 0 && !isPaid && (
        <form onSubmit={pay} className="rounded-xl border-2 border-accent bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold text-foreground">💳 {tr("pay_mobile")}</h3>
          <p className="mt-1 text-xs text-muted-foreground mb-4">
            Enter your registered phone number to confirm payment of <strong>{total.toLocaleString()} RWF</strong>.
          </p>
          <div className="flex gap-2">
            <span className="grid place-items-center rounded-md border border-input bg-secondary px-3 text-sm font-medium">+250</span>
            <Input required inputMode="numeric" maxLength={9} placeholder="78xxxxxxx" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} disabled={isPending} />
          </div>
          <div className="mt-3 flex items-start gap-2">
            <input type="checkbox" id="confirm-pay" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-0.5 accent-accent" disabled={isPending} />
            <label htmlFor="confirm-pay" className="text-xs text-muted-foreground cursor-pointer">
              I confirm I want to pay <strong>{total.toLocaleString()} RWF</strong> for my prescription medicines.
            </label>
          </div>
          <Button type="submit" disabled={!confirmed || isPending} className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
            {isPending ? tr("payment_pending") : `${tr("pay_btn")} ${total.toLocaleString()} RWF`}
          </Button>

          {ticket.paymentRequest && (
            <div className="mt-4 rounded-md border border-border bg-secondary p-3 text-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{tr("payment_request_status")} — {ticket.paymentRequest.status}</div>
                  <div className="text-xs text-muted-foreground">{ticket.paymentRequest.phone} · {ticket.paymentRequest.amount} RWF</div>
                  {isPending && <p className="mt-2 text-xs text-muted-foreground">{tr("payment_auto_check")}</p>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={checkPayment} size="sm" disabled={verifying || !isPending} variant="outline">{verifying ? tr("checking") : tr("check_payment")}</Button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {isPaid && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">
          <div className="font-semibold">{tr("payment_confirmed")}</div>
          <p className="mt-2 text-xs text-green-800">{tr("payment_success_banner")}</p>
        </div>
      )}

      {isFailed && (
        <div className="rounded-xl border border-destructive bg-red-50 p-5 text-sm text-destructive">
          <div className="font-semibold">{tr("payment_failed")}</div>
          <p className="mt-2 text-xs text-destructive">{tr("payment_failed_banner")}</p>
        </div>
      )}

      {total === 0 && (
        <Button onClick={() => db.recordPayment(ticketId, 0)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          Proceed to Pharmacy →
        </Button>
      )}
    </div>
  );
}

function PharmacyPanel({ ticket }: { ticket: QueueTicket }) {
  const tr = useT();
  const { user } = useAuth();
  const transferItems = (ticket.prescription ?? []).filter(p => p.transfer);
  const locationKey = [user?.province, user?.district, user?.sector].filter((v): v is string => !!v).map(v => v.toLowerCase());
  const nearby = NEARBY_PHARMACIES.filter(ph => locationKey.some(key => [ph.province, ph.district, ph.sector].map(v => v.toLowerCase()).includes(key)));
  const shownPharmacies = nearby.length > 0 ? nearby : NEARBY_PHARMACIES;

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
      <div className="text-center mb-6">
        <Pill className="mx-auto h-10 w-10 text-accent" />
        <h2 className="mt-3 text-xl font-semibold text-foreground">{tr("head_pharmacy")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tr("pharmacy_note")}</p>
      </div>

      {transferItems.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
            ⚠️ Some prescribed medicines are not available at the hospital pharmacy. Here are nearby pharmacies where you can buy them yourself.
          </div>
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
