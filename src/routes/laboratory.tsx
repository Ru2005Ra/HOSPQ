import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { useDb } from "@/lib/hooks";
import { db } from "@/lib/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/laboratory")({
  head: () => ({ meta: [{ title: "Laboratory — HospiQ" }] }),
  component: () => (<RoleGuard role="laboratory"><LabPage /></RoleGuard>),
});

function LabPage() {
  const tr = useT();
  const queue = useDb((d) => d.queue?.filter((t: any) => t.departmentCode === "LB" && t.status !== "done" && t.status !== "removed") ?? []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("lab_title")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("lab_desc")}</p>
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-muted-foreground">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">{tr("patient_col")}</th>
                <th className="p-3">{tr("status_col")}</th>
                <th className="p-3">{tr("actions_col")}</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">{tr("no_lab")}</td></tr>}
              {queue.map(t => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 font-semibold text-primary">#{t.token}</td>
                  <td className="p-3">{t.patientName}</td>
                  <td className="p-3 text-muted-foreground">{t.status}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => db.completeLabTicket(t.id)}>{tr("mark_complete")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
