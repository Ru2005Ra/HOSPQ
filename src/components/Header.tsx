import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks";
import { db, type Role } from "@/lib/store";
import { getLang, setLang, useT, type TKey } from "@/lib/i18n";

const ROLE_HOME: Record<Role, string> = {
  patient: "/patient",
  doctor: "/doctor",
  reception: "/reception",
  storekeeper: "/pharmacy",
  laboratory: "/laboratory",
  manager: "/manager",
};

const ROLE_LABEL: Record<Role, TKey> = {
  patient: "role_patient_label",
  doctor: "role_doctor_label",
  reception: "role_reception_label",
  storekeeper: "role_pharmacy_label",
  laboratory: "role_laboratory_label",
  manager: "role_manager_label",
};

const LAST_DASHBOARD_KEY = "hospiq_last_dashboard";

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
            {lang === "en" ? `🇷🇼 ${tr("language_kinyarwanda")}` : `🇬🇧 ${tr("language_english")}`}
          </button>

          {user ? (
            <>
              <Link
                to={ROLE_HOME[user.role]}
                className="text-sm font-medium text-foreground hover:text-accent"
              >
                {tr(ROLE_LABEL[user.role])} {tr("dashboard")}
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.setItem(LAST_DASHBOARD_KEY, location.pathname);
                  db.logout();
                  navigate({ to: "/" });
                }}
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
