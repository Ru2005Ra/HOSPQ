import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, type Role } from "@/lib/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login or Register — HospiQ" }] }),
  component: Auth,
});

const ROLE_HOME: Record<Role, string> = {
  patient: "/patient",
  doctor: "/doctor",
  reception: "/reception",
  storekeeper: "/pharmacy",
  laboratory: "/laboratory",
  manager: "/manager",
};

const LAST_DASHBOARD_KEY = "hospiq_last_dashboard";

function Auth() {
  const navigate = useNavigate();
  const tr = useT();
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleLoginSuccess = (role: Role) => {
    const lastDashboard = localStorage.getItem(LAST_DASHBOARD_KEY);
    const destination = lastDashboard === ROLE_HOME[role] ? lastDashboard : ROLE_HOME[role];
    localStorage.removeItem(LAST_DASHBOARD_KEY);
    navigate({ to: destination });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto grid max-w-md gap-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{tr("skip_line")}</h1>
          <p className="mt-1 text-base text-muted-foreground">{tr("get_back_day")}</p>
        </div>

        {mode === "login" ? (
          <UnifiedLogin onSuccess={handleLoginSuccess} onSwitchToRegister={() => setMode("register")} />
        ) : (
          <PatientRegister onSuccess={handleLoginSuccess} onSwitchToLogin={() => setMode("login")} />
        )}
      </main>
    </div>
  );
}

// Unified login component that handles both staff and patient logins
function UnifiedLogin({ onSuccess, onSwitchToRegister }: { onSuccess: (r: Role) => void; onSwitchToRegister: () => void }) {
  const tr = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Try staff login first (username-based)
      const user = db.login(username.trim(), password);
      toast.success(`${tr("welcome_back")}, ${user.firstName}`);
      onSuccess(user.role);
    } catch (staffError: any) {
      // If staff login fails, show error
      toast.error(staffError.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (forgotMode) {
    return <UnifiedForgotPassword onBack={() => setForgotMode(false)} />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">{tr("login_account")}</h2>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Username Field */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("username")}</Label>
          <Input
            required
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="mt-2"
            placeholder=""
          />
        </div>

        {/* Password Field */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("password")}</Label>
          <div className="relative mt-2">
            <Input
              required
              autoComplete="current-password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder=""
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPass(p => !p)}
            >
              {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setForgotMode(true)}
            className="text-sm text-accent hover:underline font-medium"
          >
            {tr("forgot_password")}
          </button>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-2.5 font-semibold text-base"
        >
          {isLoading ? tr("logging_in") : tr("login")}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{tr("new_to_hospiq")}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Create Account Section */}
      <button
        type="button"
        onClick={onSwitchToRegister}
        className="w-full py-2.5 px-4 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition-colors"
      >
        {tr("create_new_account")}
      </button>
    </div>
  );
}

// Patient registration component
function PatientRegister({ onSuccess, onSwitchToLogin }: { onSuccess: (r: Role) => void; onSwitchToLogin: () => void }) {
  const tr = useT();
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    sex: "female" as "male" | "female",
    carrier: "MTN",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.username.trim()) {
      return toast.error(tr("username_required"));
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      return toast.error(tr("first_last_required"));
    }

    if (!validatePhone(form.carrier, form.phone)) {
      return toast.error(tr("phone_carrier_error"));
    }

    if (form.password.length < 6) {
      return toast.error(tr("password_error"));
    }

    if (form.password !== form.confirmPassword) {
      return toast.error(tr("passwords_mismatch"));
    }

    setIsLoading(true);
    try {
      db.registerPatient({
        username: form.username.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: `+250${form.phone}`,
        password: form.password,
        sex: form.sex,
      });
      toast.success(tr("account_created_login"));
      
      // Auto-login after registration using username and password
      const user = db.login(form.username.trim(), form.password);
      onSuccess(user.role);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">{tr("create_new_account")}</h2>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        {/* Username Field */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("username")}</Label>
          <Input
            required
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            className="mt-2"
            placeholder=""
          />
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-foreground">{tr("first_name")}</Label>
            <Input
              required
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })}
              className="mt-2"
              placeholder=""
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-foreground">{tr("last_name")}</Label>
            <Input
              required
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })}
              className="mt-2"
              placeholder=""
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("sex")}</Label>
          <div className="mt-2 flex gap-4">
            {(["female", "male"] as const).map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="register_sex"
                  value={s}
                  checked={form.sex === s}
                  onChange={() => setForm({ ...form, sex: s })}
                  className="accent-accent"
                />
                <span className="text-sm capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("phone")}</Label>
          <div className="mt-2 flex gap-2">
            <select
              className="rounded-md border border-input bg-background px-3 text-sm font-medium"
              value={form.carrier}
              onChange={e => setForm({ ...form, carrier: e.target.value })}
            >
              <option>MTN</option>
              <option>Airtel</option>
            </select>
            <span className="grid place-items-center rounded-md border border-input bg-secondary px-3 text-sm font-medium text-muted-foreground">
              +250
            </span>
            <Input
              required
              inputMode="numeric"
              maxLength={9}
              placeholder=""
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("password")}</Label>
          <div className="relative mt-2">
            <Input
              required
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder=""
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPass(p => !p)}
            >
              {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("confirm_password_title")}</Label>
          <Input
            required
            type="password"
            value={form.confirmPassword}
            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
            className="mt-2"
            placeholder=""
          />
        </div>

        {/* Create Account Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-2.5 font-semibold text-base"
        >
          {isLoading ? tr("creating_account") : tr("create_account")}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{tr("already_account")}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Login Link */}
      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full py-2.5 px-4 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition-colors"
      >
        {tr("login_instead")}
      </button>
    </div>
  );
}

// Unified forgot password handler
function UnifiedForgotPassword({ onBack }: { onBack: () => void }) {
  const tr = useT();
  const [mode, setMode] = useState<"staff" | "patient">("staff");
  const [staffForm, setStaffForm] = useState({ username: "", firstName: "", lastName: "", newPassword: "", confirm: "" });
  const [patientForm, setPatientForm] = useState({ firstName: "", lastName: "", phone: "", newPassword: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStaffReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staffForm.newPassword !== staffForm.confirm) return toast.error(tr("passwords_mismatch"));
    
    setIsLoading(true);
    try {
      db.resetStaffPassword(
        staffForm.username.trim(),
        staffForm.firstName.trim(),
        staffForm.lastName.trim(),
        staffForm.newPassword
      );
      toast.success(tr("password_reset"));
      onBack();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (patientForm.newPassword !== patientForm.confirm) return toast.error(tr("passwords_mismatch"));
    
    setIsLoading(true);
    try {
      db.resetPatientPassword(
        patientForm.firstName.trim(),
        patientForm.lastName.trim(),
        patientForm.phone,
        patientForm.newPassword
      );
      toast.success(tr("password_reset"));
      onBack();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">{tr("reset_password_title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tr("reset_password_desc")}</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("staff")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
            mode === "staff" ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
          }`}
        >
          {tr("staff")}
        </button>
        <button
          onClick={() => setMode("patient")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
            mode === "patient" ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
          }`}
        >
          {tr("patient_tab")}
        </button>
      </div>

      {/* Staff Reset Form */}
      {mode === "staff" && (
        <form onSubmit={handleStaffReset} className="space-y-4">
          <div>
            <Label>{tr("username")}</Label>
            <Input
              required
              value={staffForm.username}
              onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
              className="mt-2"
              placeholder=""
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{tr("first_name")}</Label>
              <Input
                required
                value={staffForm.firstName}
                onChange={e => setStaffForm({ ...staffForm, firstName: e.target.value })}
                className="mt-2"
                placeholder=""
              />
            </div>
            <div>
              <Label>{tr("last_name")}</Label>
              <Input
                required
                value={staffForm.lastName}
                onChange={e => setStaffForm({ ...staffForm, lastName: e.target.value })}
                className="mt-2"
                placeholder=""
              />
            </div>
          </div>
          <div>
            <Label>{tr("new_password")}</Label>
            <div className="relative mt-2">
              <Input
                required
                type={showPass ? "text" : "password"}
                value={staffForm.newPassword}
                onChange={e => setStaffForm({ ...staffForm, newPassword: e.target.value })}
                placeholder=""
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPass(p => !p)}
              >
                {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <Label>{tr("confirm_password")}</Label>
            <Input
              required
              type="password"
              value={staffForm.confirm}
              onChange={e => setStaffForm({ ...staffForm, confirm: e.target.value })}
              className="mt-2"
              placeholder=""
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={isLoading}>
              {tr("back")}
            </Button>
            <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? tr("resetting") : tr("reset_password")}
            </Button>
          </div>
        </form>
      )}

      {/* Patient Reset Form */}
      {mode === "patient" && (
        <form onSubmit={handlePatientReset} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{tr("first_name")}</Label>
              <Input
                required
                value={patientForm.firstName}
                onChange={e => setPatientForm({ ...patientForm, firstName: e.target.value })}
                className="mt-2"
                placeholder=""
              />
            </div>
            <div>
              <Label>{tr("last_name")}</Label>
              <Input
                required
                value={patientForm.lastName}
                onChange={e => setPatientForm({ ...patientForm, lastName: e.target.value })}
                className="mt-2"
                placeholder=""
              />
            </div>
          </div>
          <div>
            <Label>{tr("phone")}</Label>
            <div className="mt-2 flex gap-2">
              <span className="grid place-items-center rounded-md border border-input bg-secondary px-3 text-sm font-medium text-muted-foreground">
                +250
              </span>
              <Input
                required
                inputMode="numeric"
                maxLength={9}
                placeholder=""
                value={patientForm.phone}
                onChange={e => setPatientForm({ ...patientForm, phone: e.target.value.replace(/\D/g, "") })}
              />
            </div>
          </div>
          <div>
            <Label>{tr("new_password")}</Label>
            <div className="relative mt-2">
              <Input
                required
                type={showPass ? "text" : "password"}
                value={patientForm.newPassword}
                onChange={e => setPatientForm({ ...patientForm, newPassword: e.target.value })}
                placeholder=""
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPass(p => !p)}
              >
                {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <Label>{tr("confirm_password")}</Label>
            <Input
              required
              type="password"
              value={patientForm.confirm}
              onChange={e => setPatientForm({ ...patientForm, confirm: e.target.value })}
              className="mt-2"
              placeholder=""
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={isLoading}>
              {tr("back")}
            </Button>
            <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? tr("resetting") : tr("reset_password")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function validatePhone(carrier: string, phone: string) {
  if (!/^\d{9}$/.test(phone)) return false;
  if (carrier === "MTN") return /^(78|79)/.test(phone);
  if (carrier === "Airtel") return /^(72|73)/.test(phone);
  return false;
}
