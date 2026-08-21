import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDb } from "@/lib/hooks";
import { db, DEPARTMENTS, type Role } from "@/lib/store";
import { Trash2, Pencil, Download, Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/manager")({
  head: () => ({ meta: [{ title: "Manager — HospiQ" }] }),
  component: () => (<RoleGuard role="manager"><Page /></RoleGuard>),
});

const STAFF_ROLES: { value: Role; label: string }[] = [
  { value: "doctor", label: "Doctor" },
  { value: "reception", label: "Reception" },
  { value: "storekeeper", label: "Pharmacy" },
  { value: "laboratory", label: "Laboratory" },
];

const ROLE_BADGE: Record<string, string> = {
  doctor: "bg-blue-100 text-blue-700",
  reception: "bg-green-100 text-green-700",
  storekeeper: "bg-purple-100 text-purple-700",
  laboratory: "bg-orange-100 text-orange-700",
};

type StaffForm = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: Role;
  // For doctors: which departments/diseases they treat (department codes like "DC", "EY", ...)
  departmentCodes?: string[];
};

const EMPTY: StaffForm = { firstName: "", lastName: "", username: "", password: "", role: "doctor", departmentCodes: [] };



function Page() {
  const tr = useT();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("manager_title")}</h1>
        <Tabs defaultValue="staff" className="mt-6">
          <TabsList>
            <TabsTrigger value="staff">{tr("staff_management")}</TabsTrigger>
            <TabsTrigger value="patients">{tr("patients_report")}</TabsTrigger>
            <TabsTrigger value="doctor-work">{tr("doctor_daily_work")}</TabsTrigger>
            <TabsTrigger value="attendance">{tr("attendance_tab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="staff" className="mt-6"><StaffTab /></TabsContent>
          <TabsContent value="patients" className="mt-6"><PatientsTab /></TabsContent>
          <TabsContent value="doctor-work" className="mt-6"><DoctorWorkTab /></TabsContent>
          <TabsContent value="attendance" className="mt-6"><AttendanceTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StaffTab() {
  const tr = useT();
  const staff = useDb((d) => d.users?.filter((u: any) => u.role !== "patient" && u.role !== "manager") ?? []);
  const [f, setF] = useState<StaffForm>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");

  const filtered = filterRole === "all" ? staff : staff.filter(u => u.role === filterRole);

  const DEPT_OPTIONS: { code: string; label: string }[] = [
    { code: "DC", label: "General Medicine (DC)" },
    { code: "EY", label: "Eye (EY)" },
    { code: "EN", label: "ENT (EN)" },
    { code: "MA", label: "Maternity (MA)" },
    { code: "MH", label: "Emergency (MH)" },
    { code: "PD", label: "Pediatrics (PD)" },
    // Laboratory and Pharmacy are handled by separate modules (LB, PH)
  ];


  const save = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        db.updateStaffUser(editId, f);
        toast.success(tr("staff_updated"));
      } else {
        db.addStaffUser(f);
        toast.success(tr("staff_added"));
      }
      setF(EMPTY); setEditId(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const startEdit = (u: typeof staff[0]) => {
    setEditId(u.id);
    setF({
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username ?? "",
      password: u.password,
      role: u.role,
      departmentCodes: u.departmentCodes ?? [],
    });
  };


  const remove = (id: string, name: string) => {
    if (confirm(tr("delete_staff", { name }))) { db.deleteStaffUser(id); toast.success(tr("staff_removed")); }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("HospiQ — Staff Report", 14, 18);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [["Name", "Role", "Username", "Password", "Departments/Diseases"]],
      body: staff.map(u => [
        `${u.firstName} ${u.lastName}`,
        STAFF_ROLES.find(r => r.value === u.role)?.label ?? u.role,
        u.username ?? "",
        u.password,
        (u.departmentCodes?.length ? u.departmentCodes.join(", ") : "—"),
      ]),

      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 27, 61] },
    });
    doc.save(`hospiq-staff-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Table */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setFilterRole("all")} className={`rounded-full px-3 py-1 text-xs font-medium border ${filterRole === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>{tr("all")}</button>
            {STAFF_ROLES.map(r => (
              <button key={r.value} onClick={() => setFilterRole(r.value)} className={`rounded-full px-3 py-1 text-xs font-medium border ${filterRole === r.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>{r.label}</button>
            ))}
          </div>
          <Button size="sm" onClick={exportPdf} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Download className="mr-1 h-4 w-4" /> {tr("export_pdf")}
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-muted-foreground">
              <tr>
                <th className="p-3">{tr("name_col")}</th>
                <th className="p-3">{tr("role")}</th>
                <th className="p-3">{tr("username")}</th>
                <th className="p-3">{tr("password")}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{tr("no_staff")}</td></tr>}
              {filtered.map(u => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[u.role] ?? "bg-secondary text-foreground"}`}>
                      {u.role === "doctor" ? tr("role_doctor_label") : u.role === "reception" ? tr("role_reception_label") : u.role === "storekeeper" ? tr("role_pharmacy_label") : tr("role_laboratory_label")}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">{u.username}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{u.password}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => startEdit(u)}><Pencil className="inline h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                    <button onClick={() => remove(u.id, `${u.firstName} ${u.lastName}`)}><Trash2 className="inline h-4 w-4 text-destructive" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={save} className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] h-fit">
        <h3 className="font-semibold text-foreground">{editId ? tr("edit_staff") : tr("add_staff")}</h3>
        <div>
          <Label>Role</Label>
          <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={f.role} onChange={e => setF({ ...f, role: e.target.value as Role })} disabled={!!editId}>
            {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {f.role === "doctor" && (
          <div className="rounded-lg border border-border bg-background p-3">
            <Label>{tr("departments_treated")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {tr("departments_treated_desc")}
            </p>

            <div className="mt-3 grid gap-2">
              {DEPT_OPTIONS.map((d) => {
                const checked = (f.departmentCodes ?? []).includes(d.code);
                return (
                  <label key={d.code} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card p-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? Array.from(new Set([...(f.departmentCodes ?? []), d.code]))
                          : (f.departmentCodes ?? []).filter((x) => x !== d.code);
                        setF({ ...f, departmentCodes: next });
                      }}
                    />
                    <span className="text-sm">{d.label}</span>
                  </label>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {tr("emergency_department_note")}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">

          <div><Label>{tr("first")}</Label><Input required value={f.firstName} onChange={e => setF({ ...f, firstName: e.target.value })} /></div>
          <div><Label>{tr("last")}</Label><Input required value={f.lastName} onChange={e => setF({ ...f, lastName: e.target.value })} /></div>
        </div>
        <div><Label>{tr("username")}</Label><Input required value={f.username} onChange={e => setF({ ...f, username: e.target.value })} /></div>
        <div>
          <Label>{tr("password")}</Label>
          <div className="relative mt-1">
            <Input required type={showPass ? "text" : "password"} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(p => !p)}>
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">{editId ? tr("save") : tr("add")}</Button>
        {editId && (
          <Button type="button" variant="outline" onClick={() => { setEditId(null); setF(EMPTY); }}>{tr("cancel")}</Button>
        )}
      </form>
    </div>
  );
}

function PatientsTab() {
  const tr = useT();
  const patients = useDb((d) => d.queue?.filter((t: any) => t.status === "done" || t.status === "removed") ?? []);
  const emergencyPatients = useDb((d) => d.queue?.filter((t: any) => t.emergencyAlert) ?? []);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("HospiQ — Patient Service Report", 14, 18);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [["Patient", "Date", "Department", "Insurance", "Status"]],
      body: patients.map((p: any) => [
        p.patientName,
        new Date(p.createdAt).toLocaleDateString(),
        p.department,
        p.insurance ?? "Cash",
        p.status,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 27, 61] },
    });
    doc.save(`hospiq-patients-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success(tr("patient_report_exported"));
  };

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={exportPdf} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Download className="mr-1 h-4 w-4" /> {tr("export_patient_report")}
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr><th className="p-3">{tr("patient_col")}</th><th className="p-3">{tr("date_col")}</th><th className="p-3">{tr("department")}</th><th className="p-3">{tr("insurance_col")}</th><th className="p-3">{tr("status")}</th></tr>
          </thead>
          <tbody>
            {patients.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{tr("no_patient_records")}</td></tr>}
            {patients.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">{p.patientName}</td>
                <td className="p-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="p-3">{p.department}</td>
                <td className="p-3">{p.insurance ?? "Cash"}</td>
                <td className="p-3">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{tr("emergency_patients")}</h2>
            <p className="text-sm text-muted-foreground">{tr("emergency_patients_desc")}</p>
          </div>
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">{emergencyPatients.length}</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-red-200 bg-card shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead className="bg-red-50 text-left text-red-900">
              <tr>
                <th className="p-3">{tr("patient_col")}</th>
                <th className="p-3">{tr("date_col")}</th>
                <th className="p-3">{tr("department")}</th>
                <th className="p-3">{tr("status")}</th>
                <th className="p-3">{tr("emergency_reason")}</th>
              </tr>
            </thead>
            <tbody>
              {emergencyPatients.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{tr("no_emergency_patients")}</td></tr>}
              {emergencyPatients.map((patient: any) => (
                <tr key={`emergency-${patient.id}`} className="border-t border-red-100">
                  <td className="p-3 font-medium">{patient.patientName}</td>
                  <td className="p-3 text-muted-foreground">{new Date(patient.emergencyAlert.startedAt ?? patient.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{DEPARTMENTS.find(department => department.code === patient.emergencyAlert.departmentCode)?.name ?? patient.department}</td>
                  <td className="p-3">{patient.emergencyAlert.active ? tr("emergency_active_status") : tr("emergency_resolved_status")}</td>
                  <td className="p-3 text-muted-foreground">{patient.emergencyAlert.description || patient.diagnosis || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DoctorWorkTab() {
  const tr = useT();
  const doctorWork = useDb((d) => {
    const map = new Map<string, { doctorId: string; doctorName: string; date: string; total: number; patients: string[]; departments: string[]; transfers: { patient: string; date: string }[] }>();

    for (const ticket of d.queue ?? []) {
      if (!ticket.assignedDoctorId) continue;
      const doctor = d.users.find((u: any) => u.id === ticket.assignedDoctorId && u.role === "doctor");
      if (!doctor) continue;
      const key = `${ticket.assignedDoctorId}:${new Date(ticket.createdAt).toISOString().slice(0, 10)}`;
      const row: { doctorId: string; doctorName: string; date: string; total: number; patients: string[]; departments: string[]; transfers: { patient: string; date: string }[] } = map.get(key) ?? {
        doctorId: ticket.assignedDoctorId,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        date: new Date(ticket.createdAt).toISOString().slice(0, 10),
        total: 0,
        patients: [],
        departments: [],
        transfers: [],
      };
      row.total += 1;
      row.patients.push(ticket.patientName);
      row.departments.push(ticket.department);
      const hasTransfer = (ticket.prescription ?? []).some((item: any) => item.transfer);
      if (hasTransfer) {
        row.transfers.push({ patient: ticket.patientName, date: ticket.transferDate ? new Date(ticket.transferDate).toLocaleDateString() : "Not recorded"});
      }
      map.set(key, row);
    }

    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date) || a.doctorName.localeCompare(b.doctorName));
  });

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr>
              <th className="p-3">Doctor</th>
              <th className="p-3">Date</th>
              <th className="p-3">{tr("total_patients")}</th>
              <th className="p-3">{tr("patient_col")}</th>
              <th className="p-3">{tr("department")}</th>
              <th className="p-3">{tr("transfer")}</th>
            </tr>
          </thead>
          <tbody>
            {doctorWork.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{tr("no_daily_doctor_work")}</td></tr>}
            {doctorWork.map((row) => (
              <tr key={`${row.doctorId}-${row.date}`} className="border-t border-border align-top">
                <td className="p-3 font-medium">{row.doctorName}</td>
                <td className="p-3 text-muted-foreground">{new Date(row.date).toLocaleDateString()}</td>
                <td className="p-3 font-semibold text-primary">{row.total}</td>
                <td className="p-3 text-xs text-muted-foreground">{row.patients.join(", ") || "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{Array.from(new Set(row.departments)).join(", ") || "—"}</td>
                <td className="p-3 text-xs">
                  {row.transfers.length === 0 ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">{tr("no")}</span>
                  ) : (
                    <div className="space-y-1">
                      {row.transfers.map((item, idx) => (
                        <div key={`${item.patient}-${idx}`} className="rounded bg-orange-50 px-2 py-1 text-orange-700">
                          {item.patient} — {tr("yes")} ({item.date})
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttendanceTab() {
  const tr = useT();
  const entries = useDb((d) => [...(d.attendance ?? [])].reverse());
  const doctors = useDb((d) => d.users?.filter((u: any) => u.role === "doctor") ?? []);
  const today = new Date().toDateString();
  const todayEntries = entries.filter(e => new Date(e.loginAt).toDateString() === today);
  const presentIds = new Set(todayEntries.map(e => e.doctorId));

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("HospiQ — Attendance Report", 14, 18);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [[tr("doctor_col"), tr("date_col2"), tr("login_col"), tr("logout_col")]],
      body: entries.map(e => [
        e.doctorName,
        new Date(e.loginAt).toLocaleDateString(),
        new Date(e.loginAt).toLocaleTimeString(),
        e.logoutAt ? new Date(e.logoutAt).toLocaleTimeString() : "Still in",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 27, 61] },
    });
    doc.save(`hospiq-attendance-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm uppercase tracking-wide text-muted-foreground">{tr("present_today")}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {doctors.filter(d => presentIds.has(d.id)).map(d => <li key={d.id} className="text-success">● {d.firstName} {d.lastName}</li>)}
            {doctors.filter(d => presentIds.has(d.id)).length === 0 && <li className="text-muted-foreground">{tr("nobody_today")}</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm uppercase tracking-wide text-muted-foreground">{tr("absent_today")}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {doctors.filter(d => !presentIds.has(d.id)).map(d => <li key={d.id} className="text-destructive">● {d.firstName} {d.lastName}</li>)}
            {doctors.filter(d => !presentIds.has(d.id)).length === 0 && <li className="text-muted-foreground">{tr("all_present")}</li>}
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={exportPdf} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Download className="mr-1 h-4 w-4" /> {tr("export_pdf")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr><th className="p-3">{tr("doctor_col")}</th><th className="p-3">{tr("date_col2")}</th><th className="p-3">{tr("login_col")}</th><th className="p-3">{tr("logout_col")}</th></tr>
          </thead>
          <tbody>
            {entries.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">{tr("no_attendance")}</td></tr>}
            {entries.map(e => (
              <tr key={e.id} className="border-t border-border">
                <td className="p-3">{e.doctorName}</td>
                <td className="p-3 text-muted-foreground">{new Date(e.loginAt).toLocaleDateString()}</td>
                <td className="p-3">{new Date(e.loginAt).toLocaleTimeString()}</td>
                <td className="p-3">{e.logoutAt ? new Date(e.logoutAt).toLocaleTimeString() : <em className="text-success">{tr("still_in")}</em>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
