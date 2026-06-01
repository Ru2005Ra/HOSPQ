import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks";
import { db, type Role } from "@/lib/store";
import { getLang, setLang, useT } from "@/lib/i18n";

const ROLE_HOME: Record<Role, string> = {
  patient: "/patient",
  doctor: "/doctor",
  reception: "/reception",
  storekeeper: "/pharmacy",
  laboratory: "/laboratory",
  manager: "/manager",
};

const ROLE_LABEL: Record<Role, string> = {
  patient: "Patient",
  doctor: "Doctor",
  reception: "Reception",
  storekeeper: "Pharmacy",
  laboratory: "Laboratory",
  manager: "Manager",
};

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const tr = useT();
  const lang = getLang();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">HospiQ</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{tr("home")}</Link>
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">{tr("about")}</Link>

          <button
            onClick={() => setLang(lang === "en" ? "rw" : "en")}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium hover:bg-secondary"
          >
            {lang === "en" ? "🇷🇼 Kinyarwanda" : "🇬🇧 English"}
          </button>

          {user ? (
            <>
              <Link
                to={ROLE_HOME[user.role]}
                className="text-sm font-medium text-foreground hover:text-accent"
              >
                {ROLE_LABEL[user.role]} {tr("dashboard")}
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { db.logout(); navigate({ to: "/" }); }}
              >
                <LogOut className="mr-1 h-4 w-4" /> {tr("logout")}
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/auth">{tr("login_register")}</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
