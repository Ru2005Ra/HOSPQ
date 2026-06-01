import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/hooks";
import type { Role } from "@/lib/store";
import { Header } from "./Header";

export function RoleGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && (!user || user.role !== role)) navigate({ to: "/auth" });
  }, [ready, user, navigate, role]);
  if (!user || user.role !== role) {
    return <div className="min-h-screen bg-background"><Header /></div>;
  }
  return <>{children}</>;
}
