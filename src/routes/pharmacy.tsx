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
import { db } from "@/lib/store";
import { Download, Pencil, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/pharmacy")({
  head: () => ({ meta: [{ title: "Pharmacy — HospiQ" }] }),
  component: () => (<RoleGuard role="storekeeper"><Page /></RoleGuard>),
});

function Page() {
  const tr = useT();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("pharmacy_title")}</h1>
        <Tabs defaultValue="queue" className="mt-6">
          <TabsList>
            <TabsTrigger value="queue">{tr("awaiting")}</TabsTrigger>
            <TabsTrigger value="stock">{tr("stock")}</TabsTrigger>
            <TabsTrigger value="report">{tr("reports")}</TabsTrigger>
          </TabsList>
          <TabsContent value="queue" className="mt-6"><DispenseTab /></TabsContent>
          <TabsContent value="stock" className="mt-6"><StockTab /></TabsContent>
          <TabsContent value="report" className="mt-6"><ReportTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DispenseTab() {
  const tr = useT();
  const queue = useDb((d) => d.queue?.filter((t: any) => t.status === "pharmacy") ?? []);
  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">{tr("patient_col")}</th>
              <th className="p-3">{tr("prescription")}</th>
              <th className="p-3">{tr("payment_col")}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{tr("no_patients_meds")}</td></tr>
            )}
            {queue.map(t => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-3 font-semibold text-primary">#{t.stageToken ?? t.token}</td>
                <td className="p-3">{t.patientName}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {(t.prescription ?? []).map((p: any) => `${p.name}×${p.qty}`).join(", ") || "—"}
                </td>
                <td className="p-3">
                  {t.paid ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">✅ {t.paymentMethod === "cash" ? tr("cash") : tr("paid")} — {t.paidAmount?.toLocaleString()} RWF</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">❌ {tr("unpaid")}</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {t.paymentMethod === "cash" && !t.paymentConfirmed ? (
                    <Button size="sm" onClick={() => { db.confirmCashPayment(t.id, (db.currentUser() ?? { id: "pharmacy-user" }).id); toast.success(tr("cash_payment_confirmed")); }} className="bg-amber-600 text-white hover:bg-amber-700">{tr("confirm_cash")}</Button>
                  ) : t.paid ? (
                    <Button size="sm" onClick={() => { db.dispense(t.id); toast.success(tr("dispensed")); }} className="bg-accent text-accent-foreground hover:bg-accent/90">{tr("dispense")}</Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">{tr("awaiting_payment")}</span>
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

function StockTab() {
  const tr = useT();
  const meds = useDb((d) => d.medicines ?? []);
  const [f, setF] = useState({ name: "", stock: "", price: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: f.name.trim(), stock: +f.stock, price: +f.price };
    if (!payload.name) return toast.error(tr("name_required"));
    if (editId) { db.updateMedicine(editId, payload); toast.success(tr("updated")); }
    else { db.addMedicine(payload); toast.success(tr("added")); }
    setF({ name: "", stock: "", price: "" }); setEditId(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr><th className="p-3">{tr("name_col")}</th><th className="p-3">{tr("stock_col")}</th><th className="p-3">{tr("price_col")}</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {meds.map(m => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-3 font-medium">{m.name}</td>
                <td className={`p-3 ${m.stock === 0 ? "text-destructive font-semibold" : ""}`}>{m.stock}</td>
                <td className="p-3">{m.price.toLocaleString()}</td>
                <td className="p-3 text-right space-x-1">
                  <button onClick={() => { setEditId(m.id); setF({ name: m.name, stock: String(m.stock), price: String(m.price) }); }}><Pencil className="inline h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => { if (confirm(tr("delete_item"))) db.deleteMedicine(m.id); }}><Trash2 className="inline h-4 w-4 text-destructive" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={save} className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] h-fit">
        <h3 className="font-semibold text-foreground">{editId ? tr("edit_med") : tr("add_med")}</h3>
        <div><Label>{tr("name_col")}</Label><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>{tr("stock_col")}</Label><Input type="number" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value })} /></div>
          <div><Label>{tr("price_col")}</Label><Input type="number" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></div>
        </div>
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">{editId ? tr("save") : tr("add")}</Button>
        {editId && <Button type="button" variant="outline" onClick={() => { setEditId(null); setF({ name: "", stock: "", price: "" }); }}>{tr("cancel")}</Button>}
      </form>
    </div>
  );
}

function ReportTab() {
  const tr = useT();
  const done = useDb((d) => d.queue?.filter((t: any) => t.status === "done") ?? []);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("HospiQ — Patient & Pharmacy Report", 14, 18);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [[tr("date_col"), tr("patient_col"), tr("medicines_col"), `${tr("paid")} (RWF)`]],
      body: done.map(t => [
        new Date(t.dispensedAt ?? t.createdAt).toLocaleString(),
        t.patientName,
        (t.prescription ?? []).map(p => `${p.name} x${p.qty}`).join(", "),
        (t.paidAmount ?? 0).toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 27, 61] },
    });
    doc.save(`hospiq-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{done.length} {tr("completed_visits")}</p>
        <Button onClick={exportPdf} className="bg-accent text-accent-foreground hover:bg-accent/90"><Download className="mr-2 h-4 w-4" /> {tr("export_pdf")}</Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr><th className="p-3">{tr("date_col")}</th><th className="p-3">{tr("patient_col")}</th><th className="p-3">{tr("medicines_col")}</th><th className="p-3">{tr("paid")}</th></tr>
          </thead>
          <tbody>
            {done.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">{tr("no_completed")}</td></tr>}
            {done.map(t => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-3 text-muted-foreground">{new Date(t.dispensedAt ?? t.createdAt).toLocaleString()}</td>
                <td className="p-3">{t.patientName}</td>
                <td className="p-3 text-xs text-muted-foreground">{(t.prescription ?? []).map(p => `${p.name}×${p.qty}`).join(", ")}</td>
                <td className="p-3 font-medium">{(t.paidAmount ?? 0).toLocaleString()} RWF</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
