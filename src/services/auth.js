const TOKEN_KEY = "eqc_token";
const USERS_KEY = "eqc_users";

const readUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const writeUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

export const isAuthed = () => !!localStorage.getItem(TOKEN_KEY);
export const logout = () => localStorage.removeItem(TOKEN_KEY);

export function registerSimple(email, password) {
  const users = readUsers();
  if (users.some((u) => u.email === email))
    throw new Error("Email sudah terdaftar.");
  users.push({ email, password });
  writeUsers(users);
  localStorage.setItem(TOKEN_KEY, email);
}

export function loginSimple(email, password) {
  const users = readUsers();
  const ok = users.find((u) => u.email === email && u.password === password);
  if (!ok) throw new Error("Email / password salah.");
  localStorage.setItem(TOKEN_KEY, email);
}
