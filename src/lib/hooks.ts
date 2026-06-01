import { useEffect, useRef, useState } from "react";
import { type User } from "./store";

// ─── Shared in-memory cache ───────────────────────────────────────────────────
// localStorage is parsed ONCE and cached. All useDb hooks read from this cache.
// When a hospiq:change event fires, cache is invalidated and all subscribers notified.

const KEY = "hospiq_v1";

let _cache: any = null;
let _listeners: Set<() => void> = new Set();

function getCache(): any {
  if (_cache !== null) return _cache;
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    _cache = raw ? JSON.parse(raw) : {};
  } catch {
    _cache = {};
  }
  return _cache;
}

function invalidateCache() {
  _cache = null;
  _listeners.forEach(fn => fn());
}

// Listen to store changes once globally
if (typeof window !== "undefined") {
  window.addEventListener("hospiq:change", invalidateCache);
}

// ─── useDb ────────────────────────────────────────────────────────────────────
export function useDb<T>(selector: (data: any) => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const [val, setVal] = useState<T>(() => {
    if (typeof window === "undefined") return selector({});
    return selector(getCache());
  });

  useEffect(() => {
    const update = () => {
      const next = selectorRef.current(getCache());
      setVal(prev => {
        // Shallow compare to avoid unnecessary re-renders
        if (prev === next) return prev;
        if (
          typeof prev === "object" && prev !== null &&
          typeof next === "object" && next !== null &&
          JSON.stringify(prev) === JSON.stringify(next)
        ) return prev;
        return next;
      });
    };

    _listeners.add(update);
    // Sync on mount in case data changed before effect ran
    update();
    return () => { _listeners.delete(update); };
  }, []);

  return val;
}

// ─── useAuth ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const d = getCache();
    if (!d?.session) return null;
    return d.users?.find((u: User) => u.id === d.session.userId) ?? null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => {
      const d = getCache();
      const u = d?.session ? (d.users?.find((x: User) => x.id === d.session.userId) ?? null) : null;
      setUser(u);
      setReady(true);
    };

    _listeners.add(update);
    update();
    return () => { _listeners.delete(update); };
  }, []);

  return { user, ready };
}

// ─── fmtDuration ─────────────────────────────────────────────────────────────
export function fmtDuration(ms: number) {
  if (ms <= 0) return "0 min";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}
