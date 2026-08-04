import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDb } from "@/lib/hooks";
import { db } from "@/lib/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/laboratory")({
  head: () => ({ meta: [{ title: "Laboratory — HospiQ" }] }),
  component: () => (<RoleGuard role="laboratory"><LabPage /></RoleGuard>),
});

function LabPage() {
  const tr = useT();
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const queue = useDb((d) => d.queue?.filter((t: any) => t.departmentCode === "LB" && t.status !== "done" && t.status !== "removed") ?? []);

  const openResultModal = (ticket: any) => {
    setActiveTicket(ticket);
    const initialResults: Record<string, string> = {};
    ticket.labRequestedTests?.forEach((lab: any) => {
      initialResults[lab.testId] = lab.result ?? "";
    });
    setResults(initialResults);
  };

  const saveResults = () => {
    if (!activeTicket) return;
    db.recordLabResults(activeTicket.id, results);
    toast.success(tr("lab_output_saved"));
    setActiveTicket(null);
  };

  const exportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("HospiQ — Laboratory report", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [["Token", "Patient", "Requested by", "Tests", "Results", "Status", "Assigned Doctor", "Created At"]],
      body: queue.map((t: any) => {
        const tests = t.labRequestedTests?.map((lab: any) => lab.name).join("; ") || "";
        const resultsText = t.labRequestedTests?.map((lab: any) => `${lab.name}: ${lab.result ?? ""}`).join("; ") || "";
        return [
          t.token,
          t.patientName,
          t.assignedDoctorName ?? "",
          tests,
          resultsText,
          t.status,
          t.assignedDoctorName ?? "",
          new Date(t.createdAt).toLocaleString(),
        ];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 27, 61] },
    });
    doc.save(`lab_report_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
    toast.success(tr("lab_report_exported"));
  };

  const requestedTestsSummary = (ticket: any) => {
    if (!ticket.labRequestedTests?.length) return tr("no_lab_tests_requested");
    return ticket.labRequestedTests
      .map((lab: any) => {
        const statusLabel = lab.status === "done" ? tr("done") : tr("requested");
        const resultLabel = lab.result ? `: ${lab.result}` : "";
        return `${lab.name} (${statusLabel}${resultLabel})`;
      })
      .join("; ");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("lab_title")}</h1>
            <p className="mt-2 text-muted-foreground">{tr("lab_desc")}</p>
          </div>
          <Button onClick={exportReport} className="w-full sm:w-auto">{tr("export_lab_report")}</Button>
        </div>
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-muted-foreground">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">{tr("patient_col")}</th>
                <th className="p-3">{tr("requested_by")}</th>
                <th className="p-3">{tr("tests_col")}</th>
                <th className="p-3">{tr("status_col")}</th>
                <th className="p-3">{tr("actions_col")}</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{tr("no_lab")}</td></tr>}
              {queue.map(t => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 font-semibold text-primary">#{t.token}</td>
                  <td className="p-3">{t.patientName}</td>
                  <td className="p-3 text-muted-foreground text-xs">{t.assignedDoctorName ?? tr("unknown_doctor")}</td>
                  <td className="p-3 text-muted-foreground text-xs">{requestedTestsSummary(t)}</td>
                  <td className="p-3 text-muted-foreground">{t.status}</td>
                  <td className="p-3 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openResultModal(t)} disabled={!t.labRequestedTests?.length}>{tr("record_results")}</Button>
                    <Button size="sm" variant="outline" onClick={() => db.completeLabTicket(t.id)}>{tr("mark_complete")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {activeTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{tr("lab_output_prompt")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{activeTicket.patientName} — #{activeTicket.token}</p>
                </div>
                <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setActiveTicket(null)}>×</button>
              </div>
              <div className="mt-6 grid gap-4">
                {activeTicket.labRequestedTests?.map((lab: any) => (
                  <div key={lab.testId}>
                    <Label className="text-sm font-semibold">{lab.name}</Label>
                    <Textarea
                      value={results[lab.testId] ?? ""}
                      onChange={(e) => setResults(r => ({ ...r, [lab.testId]: e.target.value }))}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setActiveTicket(null)}>{tr("cancel")}</Button>
                <Button onClick={saveResults}>{tr("save_results")}</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
