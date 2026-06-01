import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Clock, Hospital, Users, Stethoscope, Pill, BadgeCheck } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HospiQ — Skip the hospital queue" },
      { name: "description", content: "Smart hospital queue management. Register, get your token, and know exactly when to see the doctor." },
    ],
  }),
  component: Index,
});

function Index() {
  const tr = useT();
  const roles = [
    { i: Users, tk: "role_patient" as const, dk: "role_patient_desc" as const },
    { i: BadgeCheck, tk: "role_reception" as const, dk: "role_reception_desc" as const },
    { i: Stethoscope, tk: "role_doctor" as const, dk: "role_doctor_desc" as const },
    { i: Pill, tk: "role_pharmacy" as const, dk: "role_pharmacy_desc" as const },
    { i: Clock, tk: "role_manager" as const, dk: "role_manager_desc" as const },
    { i: Hospital, tk: "role_queue" as const, dk: "role_queue_desc" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <div className="mx-auto max-w-6xl px-4 py-24 text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide backdrop-blur">
              <Hospital className="h-3.5 w-3.5" /> {tr("hero_badge")}
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              {tr("hero_title")} <span className="text-accent">{tr("hero_accent")}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/80">{tr("hero_desc")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth">{tr("get_token")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <Link to="/about">{tr("how_it_works")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{tr("one_system")}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{tr("one_system_desc")}</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roles.map(({ i: Icon, tk, dk }) => (
              <div key={tk} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <Icon className="h-8 w-8 text-accent" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">{tr(tk)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tr(dk)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-secondary py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{tr("ready_title")}</h2>
            <p className="mt-3 text-muted-foreground">{tr("ready_desc")}</p>
            <Button asChild size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/auth">{tr("get_started")}</Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} HospiQ. {tr("footer")}
        </footer>
      </main>
    </div>
  );
}
