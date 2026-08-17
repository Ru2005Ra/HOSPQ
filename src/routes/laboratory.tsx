import { createFileRoute } from "@tanstack/react-router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDb } from "@/lib/hooks";
import { db } from "@/lib/store";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/laboratory")({
  head: () => ({ meta: [{ title: "Laboratory — HospiQ" }] }),
  component: () => (<RoleGuard role="laboratory"><LabPage /></RoleGuard>),
});

function LabPage() {
  const tr = useT();
  const queue = useDb((d) => d.queue?.filter((t: any) => t.departmentCode === "LB" && t.status !== "done" && t.status !== "removed") ?? []);
  const completed = useDb((d) => d.queue?.filter((t: any) => t.departmentCode === "LB" && t.status === "done") ?? []);
  const [resultModal, setResultModal] = useState<{ ticketId: string; ticketName: string; tests: any[] } | null>(null);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("HospiQ — Laboratory Test Report", 14, 18);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [[tr("token_col"), tr("patient_col"), "Test Ordered", "Status", "Completed Date"]],
      body: completed.map(t => [
        `#${t.token}`,
        t.patientName,
        (t.labTests ?? []).join(", ") || "—",
        "Completed",
        t.status === "done" ? new Date(t.updatedAt ?? t.createdAt).toLocaleString() : "—",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 27, 61] },
    });
    doc.save(`hospiq-lab-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Report exported successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("lab_title")}</h1>
            <p className="mt-2 text-muted-foreground">{tr("lab_desc")}</p>
          </div>
          <Button onClick={exportPdf} variant="outline" className="border-accent text-accent hover:bg-accent/10"><Download className="mr-2 h-4 w-4" /> {tr("export_pdf")}</Button>
        </div>
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-muted-foreground">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">{tr("patient_col")}</th>
                <th className="p-3">Tests</th>
                <th className="p-3">Status</th>
                <th className="p-3">Requested by</th>
                <th className="p-3">{tr("actions_col")}</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{tr("no_lab")}</td></tr>}
              {queue.map(t => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 font-semibold text-primary">#{t.token}</td>
                  <td className="p-3">{t.patientName}</td>
                  <td className="p-3 text-xs">
                    {(t.labRequestedTests ?? []).map((test: any, i: number) => (
                      <div key={i}>{test.name}</div>
                    ))}
                  </td>
                  <td className="p-3 text-xs">
                    {(t.labRequestedTests ?? []).map((test: any, i: number) => (
                      <div key={i} className={test.status === "done" ? "text-green-600 font-medium" : "text-orange-600"}>
                        {test.status}
                      </div>
                    ))}
                  </td>
                  <td className="p-3 text-xs">{t.labRequestedTests?.[0]?.requestedByDoctorName || "—"}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setResultModal({ ticketId: t.id, ticketName: t.patientName, tests: t.labRequestedTests ?? [] })}>Enter Results</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {resultModal && <ResultModal {...resultModal} onClose={() => setResultModal(null)} />}
      </main>
    </div>
  );
}

interface ResultModalProps {
  ticketId: string;
  ticketName: string;
  tests: any[];
  onClose: () => void;
}

function ResultModal({ ticketId, ticketName, tests, onClose }: ResultModalProps) {
  const tr = useT();
  const [results, setResults] = useState<{ [testId: string]: { result: string; unit: string; normalRange: string } }>({});

  const handleResultChange = (testId: string, field: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [field]: value
      }
    }));
  };

  const submitResults = () => {
    for (const test of tests) {
      if (results[test.testId]?.result) {
        db.enterLabResult(ticketId, {
          testId: test.testId,
          name: test.name,
          result: results[test.testId].result,
          unit: results[test.testId].unit || "",
          normalRange: results[test.testId].normalRange || ""
        });
      }
    }
    toast.success("Lab results saved successfully");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-lg max-h-96 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Enter Lab Results</h2>
        <p className="text-sm text-muted-foreground mb-4">{ticketName}</p>
        
        <div className="space-y-4">
          {tests.map((test: any) => (
            <div key={test.testId} className="border border-border rounded-lg p-4 bg-secondary/30">
              <h3 className="font-medium text-foreground mb-3">{test.name}</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Result</Label>
                  <Input 
                    placeholder="e.g., 7.5"
                    value={results[test.testId]?.result || ""}
                    onChange={(e) => handleResultChange(test.testId, "result", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Input 
                    placeholder="e.g., mg/dL"
                    value={results[test.testId]?.unit || ""}
                    onChange={(e) => handleResultChange(test.testId, "unit", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Normal Range</Label>
                  <Input 
                    placeholder="e.g., 3.5-5.5"
                    value={results[test.testId]?.normalRange || ""}
                    onChange={(e) => handleResultChange(test.testId, "normalRange", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submitResults} className="bg-green-600 text-white hover:bg-green-700">
            Save Results
          </Button>
        </div>
      </div>
    </div>
  );
}
