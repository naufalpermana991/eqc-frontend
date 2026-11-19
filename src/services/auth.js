// =====================================================================
// AUTH — login ke backend Go (POST /api/auth/login), sesi menyimpan token + data user.
//
// "Remember me" → localStorage (bertahan setelah browser ditutup),
// selain itu → sessionStorage (hilang saat tab/browser ditutup).
// =====================================================================
import { api } from "./api";

const SESSION_KEY = "eqc_session";
const LEGACY_TOKEN_KEY = "eqc_token"; // sesi mock lama — hanya dibersihkan saat logout
const stores = [localStorage, sessionStorage];

export const ROLE_LABEL = { admin: "Admin", manager: "Manager", supervisor: "Supervisor", operator: "Operator" };

/** Halaman awal tiap role setelah login. */
export const ROLE_HOME = {
  admin: "/history",
  operator: "/operator/checking",
  manager: "/manager/approval",
  supervisor: "/supervisor/approval",
};
export const homeFor = (role) => ROLE_HOME[role] ?? "/login";

/** Halaman milik role: /operator/..., /supervisor/..., /manager/... → role itu, selebihnya Admin. */
export const roleOfPath = (path = "") =>
  ["operator", "supervisor", "manager"].find((r) => path.startsWith(`/${r}`)) ?? "admin";

function readSession() {
  for (const s of stores) {
    try {
      const raw = s.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* data rusak → anggap belum login */
    }
  }
  return null;
}

export const getToken = () => readSession()?.token ?? null;
export const isAuthed = () => !!getToken();
/** { name, id, role, username, photoUrl } user yang sedang login, atau null. */
export const getCurrentUser = () => readSession()?.user ?? null;

export const logout = () =>
  stores.forEach((s) => {
    s.removeItem(SESSION_KEY);
    s.removeItem(LEGACY_TOKEN_KEY);
  });

export class LoginError extends Error {}

/** Return user yang login. Lempar LoginError kalau username/password salah atau server tidak bisa dihubungi. */
export async function login(username, password, remember = false) {
  if (!username || !password) throw new LoginError("Username and password are required.");

  let data;
  try {
    data = await api("/auth/login", { method: "POST", body: { username, password }, auth: false });
  } catch (err) {
    throw new LoginError(err.message);
  }

  logout();
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify({ token: data.token, user: data.user }));
  return data.user;
}
