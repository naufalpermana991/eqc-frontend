import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginSimple, registerSimple } from "../services/auth";

export default function AuthSimple() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const from = useLocation().state?.from?.pathname || "/";

  function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") loginSimple(email, pass);
      else registerSimple(email, pass);
      nav(from, { replace: true });
    } catch (e) {
      setErr(e.message || "Gagal.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-xl border">
        <h1 className="text-xl font-semibold mb-1">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {mode === "login" ? "Masuk ke akun Anda" : "Daftar dengan email & password"}
        </p>

        {err && <div className="mb-4 text-sm text-red-700 bg-red-50 rounded px-3 py-2">{err}</div>}

        <label className="block text-sm mb-1">Email</label>
        <input
          className="h-10 w-full rounded-md border border-gray-300 px-3 mb-3"
          value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"
        />

        <label className="block text-sm mb-1">Password</label>
        <input
          type="password"
          className="h-10 w-full rounded-md border border-gray-300 px-3 mb-4"
          value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
        />

        <button className="h-10 w-full rounded-md bg-red-700 text-white hover:bg-red-900">
          {mode === "login" ? "Masuk" : "Daftar"}
        </button>

        <div className="mt-4 text-sm text-gray-600">
          {mode === "login" ? (
            <button type="button" onClick={()=>setMode("register")} className="underline">
              Belum punya akun? Daftar
            </button>
          ) : (
            <button type="button" onClick={()=>setMode("login")} className="underline">
              Sudah punya akun? Masuk
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
