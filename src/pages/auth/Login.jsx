import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginError, login, roleOfPath, homeFor } from "../../services/auth";
import logo from "../../assets/logo.png";

// Figma: UI Design 1 → Admin / Login page (node 124:681), 1440×900.
// Card 440×510, padding 40 (x) / 32 (y), inputs & button 48px.
// Error & loading state belum ada di Figma → pakai pola helper text error dari design system.

function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function EyeIcon({ open, ...props }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

const inputClass =
  "h-12 w-full rounded-lg border border-gray-300 bg-white pl-10 text-body-1 text-gray-900 shadow-xs " +
  "placeholder:text-gray-500 focus:border-focus-border focus:outline-none focus:shadow-focus-primary";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  // Tombol aktif hanya jika username & password terisi (spasi saja = kosong)
  const canSubmit = username.trim() !== "" && password !== "" && !busy;
  const from = useLocation().state?.from?.pathname;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const user = await login(username.trim(), password, remember);
      // Kembali ke halaman semula hanya kalau halaman itu milik role user ini
      const back = from && from !== "/" && roleOfPath(from) === user.role ? from : null;
      navigate(back ?? homeFor(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof LoginError ? err.message : "Login failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 p-4 font-sans">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[440px] rounded-xl bg-white px-10 py-8 shadow-xs"
      >
        <img src={logo} alt="Merah Putih" className="mx-auto h-[78px] w-auto" />

        <h1 className="mt-6 text-center text-h5 text-gray-900">Welcome to E-QC System</h1>
        <p className="mt-3 text-center text-body-1 text-gray-600">Please input details below</p>

        <div className="mt-8 space-y-5">
          <div className="relative">
            <label htmlFor="username" className="sr-only">Username</label>
            <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              placeholder="Enter username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              className={`${inputClass} pr-3.5`}
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">Password</label>
            <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <EyeIcon open={showPassword} className="size-5" />
            </button>
          </div>
        </div>

        {error && (
          <p id="login-error" role="alert" className="mt-3 text-helper-text text-error-600">
            {error}
          </p>
        )}

        <label className="mt-8 flex h-5 w-fit cursor-pointer items-center gap-2 text-body-2 text-gray-700">
          <span className="relative grid size-4 place-items-center">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="peer size-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-checkbox-border checked:bg-checkbox-bg focus-visible:shadow-focus-primary focus:outline-none"
            />
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute size-3 text-checkbox-border opacity-0 peer-checked:opacity-100">
              <path d="M2.5 6.5 5 9l4.5-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Remember me
        </label>

        {/* Figma: tombol pakai Error/600 (#D92D20), bukan Brand/red-500 */}
        <button
          type="submit"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          // Disabled tanpa perubahan warna (sesuai desain); hanya hover & cursor yang dimatikan
          className="mt-8 h-12 w-full rounded-lg bg-error-600 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:cursor-pointer enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
        >
          {busy ? "Logging in…" : "Login"}
        </button>
      </form>
    </main>
  );
}
