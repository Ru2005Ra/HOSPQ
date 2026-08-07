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
  head: () => ({ meta: [{ title: "Login — HospiQ" }] }),
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

function Auth() {
  const navigate = useNavigate();
  const tr = useT();
  const go = (role: Role) => navigate({ to: ROLE_HOME[role] });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto grid max-w-md gap-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{tr("welcome")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tr("welcome_sub")}</p>
        </div>
        <UnifiedAuth onSuccess={go} />
      </main>
    </div>
  );
}

function validatePhone(carrier: string, phone: string) {
  if (!/^\d{9}$/.test(phone)) return false;
  if (carrier === "MTN") return /^(78|79)/.test(phone);
  if (carrier === "Airtel") return /^(72|73)/.test(phone);
  return false;
}

type AuthView = "login" | "register" | "forgot";

function UnifiedAuth({ onSuccess }: { onSuccess: (r: Role) => void }) {
  const [view, setView] = useState<AuthView>("login");
  const tr = useT();

  if (view === "login") {
    return (
      <LoginForm
        onSuccess={onSuccess}
        onRegister={() => setView("register")}
        onForgot={() => setView("forgot")}
      />
    );
  }
  if (view === "register") {
    return (
      <RegisterForm
        onSuccess={onSuccess}
        onBack={() => setView("login")}
      />
    );
  }
  return <ForgotPasswordForm onBack={() => setView("login")} />;
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative mt-1">
      <Input
        required
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        onClick={() => setShow(p => !p)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function LoginForm({ onSuccess, onRegister, onForgot }: { onSuccess: (r: Role) => void; onRegister: () => void; onForgot: () => void }) {
  const tr = useT();
  const [f, setF] = useState({ username: "", password: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const u = db.login(f.username.trim(), f.password);
      toast.success(u.role === "patient" ? tr("welcome_back") : `${tr("welcome_back")}, ${u.firstName}`);
      onSuccess(u.role);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold text-foreground">{tr("login_to_account")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{tr("login_desc")}</p>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        <div>
          <Label>{tr("username")}</Label>
          <Input required value={f.username} onChange={e => setF({ ...f, username: e.target.value })} />
        </div>
        <div>
          <Label>{tr("password")}</Label>
          <PasswordInput value={f.password} onChange={v => setF({ ...f, password: v })} />
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onForgot} className="text-xs text-accent hover:underline">
            {tr("forgot_password")}
          </button>
        </div>
        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">{tr("login")}</Button>
      </form>

      <div className="mt-4 border-t border-border pt-4 text-center">
        <p className="text-sm text-muted-foreground">{tr("new_to_hospiq")}</p>
        <button onClick={onRegister} className="mt-1 text-sm font-semibold text-accent hover:underline">
          {tr("create_account_link")}
        </button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {tr("demo_label")} <code>reception</code>/<code>reception123</code>, <code>doctor</code>/<code>doctor123</code>,{" "}
        <code>pharmacy</code>/<code>pharmacy123</code>, <code>manager</code>/<code>manager123</code>, <code>lab</code>/<code>lab123</code>
      </p>
    </div>
  );
}

function RegisterForm({ onSuccess, onBack }: { onSuccess: (r: Role) => void; onBack: () => void }) {
  const tr = useT();
  const [f, setF] = useState({ firstName: "", lastName: "", username: "", sex: "female" as "male" | "female", carrier: "MTN", phone: "", password: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(f.carrier, f.phone)) return toast.error(tr("phone_error"));
    if (f.password.length < 6) return toast.error(tr("password_error"));
    try {
      db.registerPatient({
        firstName: f.firstName.trim(),
        lastName: f.lastName.trim(),
        username: f.username.trim().toLowerCase(),
        phone: `+250${f.phone}`,
        password: f.password,
        sex: f.sex,
      });
      toast.success(tr("welcome_msg"));
      onSuccess("patient");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold text-foreground">{tr("new_to_hospiq")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{tr("first_name")}</Label><Input required value={f.firstName} onChange={e => setF({ ...f, firstName: e.target.value })} /></div>
        <div><Label>{tr("last_name")}</Label><Input required value={f.lastName} onChange={e => setF({ ...f, lastName: e.target.value })} /></div>
      </div>
      <div>
        <Label>{tr("username")}</Label>
        <Input required value={f.username} onChange={e => setF({ ...f, username: e.target.value })} />
      </div>
      <div>
        <Label>{tr("sex")}</Label>
        <div className="mt-1 flex gap-4">
          {(["female", "male"] as const).map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="register_sex"
                value={s}
                checked={f.sex === s}
                onChange={() => setF({ ...f, sex: s })}
                className="accent-accent"
              />
              <span className="text-sm">{tr(s as "male" | "female")}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>{tr("phone")}</Label>
        <div className="mt-1 flex gap-2">
          <select className="rounded-md border border-input bg-background px-2 text-sm" value={f.carrier} onChange={e => setF({ ...f, carrier: e.target.value })}>
            <option>MTN</option><option>Airtel</option>
          </select>
          <span className="grid place-items-center rounded-md border border-input bg-secondary px-3 text-sm font-medium">+250</span>
          <Input required inputMode="numeric" maxLength={9} placeholder="78xxxxxxx" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })} />
        </div>
      </div>
      <div>
        <Label>{tr("password")}</Label>
        <PasswordInput value={f.password} onChange={v => setF({ ...f, password: v })} />
      </div>
      <p className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">{tr("location_note")}</p>
      <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">{tr("create_account")}</Button>
      <Button type="button" variant="outline" onClick={onBack}>{tr("back_to_login")}</Button>
    </form>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const tr = useT();
  const [f, setF] = useState({ username: "", firstName: "", lastName: "", newPassword: "", confirm: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return toast.error(tr("passwords_do_not_match"));
    try {
      db.resetPassword(f.username.trim(), f.firstName.trim(), f.lastName.trim(), f.newPassword);
      toast.success(tr("password_reset_success"));
      onBack();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">{tr("reset_your_password")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{tr("login_desc")}</p>
      </div>
      <div><Label>{tr("username")}</Label><Input required value={f.username} onChange={e => setF({ ...f, username: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{tr("first_name")}</Label><Input required value={f.firstName} onChange={e => setF({ ...f, firstName: e.target.value })} /></div>
        <div><Label>{tr("last_name")}</Label><Input required value={f.lastName} onChange={e => setF({ ...f, lastName: e.target.value })} /></div>
      </div>
      <div>
        <Label>{tr("new_password")}</Label>
        <PasswordInput value={f.newPassword} onChange={v => setF({ ...f, newPassword: v })} />
      </div>
      <div><Label>{tr("confirm_password")}</Label><Input required type="password" value={f.confirm} onChange={e => setF({ ...f, confirm: e.target.value })} /></div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>{tr("back_to_login")}</Button>
        <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">{tr("reset_your_password")}</Button>
      </div>
    </form>
  );
}

