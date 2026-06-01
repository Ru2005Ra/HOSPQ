import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "How HospiQ works" }] }),
  component: About,
});

function About() {
  const tr = useT();
  const steps = [
    { n: 1, t: tr("step1_t"), d: tr("step1_d") },
    { n: 2, t: tr("step2_t"), d: tr("step2_d") },
    { n: 3, t: tr("step3_t"), d: tr("step3_d") },
    { n: 4, t: tr("step4_t"), d: tr("step4_d") },
    { n: 5, t: tr("step5_t"), d: tr("step5_d") },
    { n: 6, t: tr("step6_t"), d: tr("step6_d") },
  ];
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{tr("about_title")}</h1>
        <p className="mt-3 text-muted-foreground">{tr("about_subtitle")}</p>
        <ol className="mt-10 space-y-6">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-foreground">{s.n}</div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{s.t}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12 rounded-xl border border-border bg-secondary p-6 text-sm text-muted-foreground">
          <strong className="text-foreground">{tr("demo_accounts")}</strong> — username / password
          <ul className="mt-2 grid grid-cols-2 gap-2">
            <li><code>reception</code> / <code>reception123</code></li>
            <li><code>doctor</code> / <code>doctor123</code></li>
            <li><code>pharmacy</code> / <code>pharmacy123</code></li>
            <li><code>manager</code> / <code>manager123</code></li>
          </ul>
        </div>
      </main>
    </div>
  );
}
