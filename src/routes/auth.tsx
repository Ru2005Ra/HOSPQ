import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <Tabs defaultValue="patient" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="patient">{tr("patient_tab")}</TabsTrigger>
            <TabsTrigger value="staff">{tr("staff_tab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="patient" className="mt-6">
            <PatientForms onSuccess={() => go("patient")} />
          </TabsContent>
          <TabsContent value="staff" className="mt-6">
            <StaffLogin onSuccess={(r) => go(r)} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function PatientForms({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const tr = useT();
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex gap-2 text-sm">
        <button onClick={() => setMode("register")} className={mode === "register" ? "font-semibold text-accent" : "text-muted-foreground hover:text-foreground"}>{tr("new_patient")}</button>
        <span className="text-muted-foreground">·</span>
        <button onClick={() => setMode("login")} className={mode === "login" ? "font-semibold text-accent" : "text-muted-foreground hover:text-foreground"}>{tr("existing_patient")}</button>
      </div>
      {mode === "register" ? <Register onSuccess={onSuccess} /> : <Login onSuccess={onSuccess} />}
    </div>
  );
}

function validatePhone(carrier: string, phone: string) {
  if (!/^\d{9}$/.test(phone)) return false;
  if (carrier === "MTN") return /^(78|79)/.test(phone);
  if (carrier === "Airtel") return /^(72|73)/.test(phone);
  return false;
}

function Register({ onSuccess }: { onSuccess: () => void }) {
  const tr = useT();
  const [f, setF] = useState({ firstName: "", lastName: "", sex: "female" as "male" | "female", carrier: "MTN", phone: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(f.carrier, f.phone)) return toast.error("Phone must be 9 digits and start with 78/79 for MTN or 72/73 for Airtel.");
    if (f.password.length < 6) return toast.error(tr("password_error"));
    try {
      db.registerPatient({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), phone: `+250${f.phone}`, password: f.password, sex: f.sex });
      toast.success(tr("welcome_msg"));
      onSuccess();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{tr("first_name")}</Label><Input required value={f.firstName} onChange={e => setF({ ...f, firstName: e.target.value })} /></div>
        <div><Label>{tr("last_name")}</Label><Input required value={f.lastName} onChange={e => setF({ ...f, lastName: e.target.value })} /></div>
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
        <div className="relative mt-1">
          <Input required type={showPass ? "text" : "password"} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(p => !p)}>
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <p className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">{tr("location_note")}</p>
      <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">{tr("create_account")}</Button>
    </form>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const tr = useT();
  const [f, setF] = useState({ firstName: "", lastName: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [forgot, setForgot] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try { db.loginPatient(f.firstName.trim(), f.lastName.trim(), f.password); toast.success(tr("welcome_back")); onSuccess(); }
    catch (e: any) { toast.error(e.message); }
  };
  if (forgot) return <ForgotPasswordPatient onBack={() => setForgot(false)} />;
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Login to your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Use your name and password. You will be taken to your patient dashboard automatically.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-foreground">{tr("first_name")}</Label>
            <Input
              required
              value={f.firstName}
              onChange={e => setF({ ...f, firstName: e.target.value })}
              className="mt-2"
              placeholder="First name"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-foreground">{tr("last_name")}</Label>
            <Input
              required
              value={f.lastName}
              onChange={e => setF({ ...f, lastName: e.target.value })}
              className="mt-2"
              placeholder="Last name"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("password")}</Label>
          <div className="relative mt-2">
            <Input
              required
              type={showPass ? "text" : "password"}
              value={f.password}
              onChange={e => setF({ ...f, password: e.target.value })}
              placeholder="Enter your password"
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
            onClick={() => setForgot(true)}
            className="text-sm text-accent hover:underline font-medium"
          >
            Forgot password?
          </button>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-2.5 font-semibold text-base"
        >
          {tr("login")}
        </Button>
      </form>
    </div>
  );
}

function ForgotPasswordPatient({ onBack }: { onBack: () => void }) {
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", newPassword: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return toast.error("Passwords do not match");
    try { db.resetPatientPassword(f.firstName.trim(), f.lastName.trim(), f.phone, f.newPassword); toast.success("Password reset successfully"); onBack(); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <form onSubmit={submit} className="grid gap-4">
      <p className="text-sm font-medium">Reset your password</p>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>First name</Label><Input required value={f.firstName} onChange={e => setF({ ...f, firstName: e.target.value })} /></div>
        <div><Label>Last name</Label><Input required value={f.lastName} onChange={e => setF({ ...f, lastName: e.target.value })} /></div>
      </div>
      <div>
        <Label>Phone (+250)</Label>
        <div className="mt-1 flex gap-2">
          <span className="grid place-items-center rounded-md border border-input bg-secondary px-3 text-sm font-medium">+250</span>
          <Input required inputMode="numeric" maxLength={9} placeholder="78xxxxxxx" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })} />
        </div>
      </div>
      <div>
        <Label>New password</Label>
        <div className="relative mt-1">
          <Input required type={showPass ? "text" : "password"} value={f.newPassword} onChange={e => setF({ ...f, newPassword: e.target.value })} />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(p => !p)}>
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div><Label>Confirm password</Label><Input required type="password" value={f.confirm} onChange={e => setF({ ...f, confirm: e.target.value })} /></div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">Reset password</Button>
      </div>
    </form>
  );
}

function StaffLogin({ onSuccess }: { onSuccess: (r: Role) => void }) {
  const tr = useT();
  const [f, setF] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [forgot, setForgot] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try { const u = db.loginStaff(f.username.trim(), f.password); toast.success(`${tr("welcome_back")}, ${u.firstName}`); onSuccess(u.role); }
    catch (e: any) { toast.error(e.message); }
  };
  if (forgot) return <ForgotPasswordStaff onBack={() => setForgot(false)} />;
  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Login to your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Use your username and password. You will be taken to the right dashboard automatically.</p>
      </div>

      <div className="space-y-5">
        {/* Username Field */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("username")}</Label>
          <Input
            required
            value={f.username}
            onChange={e => setF({ ...f, username: e.target.value })}
            className="mt-2"
            placeholder="Enter your username"
          />
        </div>

        {/* Password Field */}
        <div>
          <Label className="text-sm font-semibold text-foreground">{tr("password")}</Label>
          <div className="relative mt-2">
            <Input
              required
              type={showPass ? "text" : "password"}
              value={f.password}
              onChange={e => setF({ ...f, password: e.target.value })}
              placeholder="Enter your password"
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
            onClick={() => setForgot(true)}
            className="text-sm text-accent hover:underline font-medium"
          >
            Forgot password?
          </button>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-2.5 font-semibold text-base"
        >
          {tr("login")}
        </Button>

        {/* New Account Section */}
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            New to HospiQ?{" "}
            <button type="button" className="text-accent hover:underline font-semibold">
              Create a new account
            </button>
          </p>
        </div>
      </div>

      {/* Demo Credentials */}
      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-xs text-blue-600 font-medium">
          Demo: <span className="font-mono">reception/reception123</span>, <span className="font-mono">doctor/doctor123</span>,{" "}
          <span className="font-mono">pharmacy/pharmacy123</span>, <span className="font-mono">manager/manager123</span>, <span className="font-mono">lab/lab123</span>
        </p>
      </div>
    </form>
  );
}

function ForgotPasswordStaff({ onBack }: { onBack: () => void }) {
  const [f, setF] = useState({ username: "", firstName: "", lastName: "", newPassword: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return toast.error("Passwords do not match");
    try { db.resetStaffPassword(f.username.trim(), f.firstName.trim(), f.lastName.trim(), f.newPassword); toast.success("Password reset successfully"); onBack(); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <p className="text-sm font-medium">Reset your password</p>
      <div><Label>Username</Label><Input required value={f.username} onChange={e => setF({ ...f, username: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>First name</Label><Input required value={f.firstName} onChange={e => setF({ ...f, firstName: e.target.value })} /></div>
        <div><Label>Last name</Label><Input required value={f.lastName} onChange={e => setF({ ...f, lastName: e.target.value })} /></div>
      </div>
      <div>
        <Label>New password</Label>
        <div className="relative mt-1">
          <Input required type={showPass ? "text" : "password"} value={f.newPassword} onChange={e => setF({ ...f, newPassword: e.target.value })} />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(p => !p)}>
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div><Label>Confirm password</Label><Input required type="password" value={f.confirm} onChange={e => setF({ ...f, confirm: e.target.value })} /></div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">Reset password</Button>
      </div>
    </form>
  );
}
