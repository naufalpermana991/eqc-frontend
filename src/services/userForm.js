// Validasi & payload form user — dipakai Add user dan Edit user.
import { getAvatarColor } from "./avatar";

export const EMPTY_USER = { fullName: "", level: "", username: "", password: "", photoUrl: "" };

/**
 * passwordRequired: true di Add user. Di Edit user false → kosong = password tidak diubah.
 */
export function validateUser(v, { passwordRequired = true } = {}) {
  const e = {};
  if (!v.fullName.trim()) e.fullName = "Full name is required.";
  else if (v.fullName.trim().length < 2) e.fullName = "Full name is too short.";

  if (!v.level) e.level = "Select a user level.";

  if (!v.username.trim()) e.username = "Username is required.";
  else if (!/^[a-zA-Z0-9._]{3,30}$/.test(v.username.trim()))
    e.username = "3–30 characters: letters, numbers, dot or underscore. No spaces.";

  if (!v.password) {
    if (passwordRequired) e.password = "Password is required.";
  } else if (v.password.length < 8) e.password = "Password must be at least 8 characters.";

  return e;
}

/**
 * multipart/form-data untuk backend Go.
 * photo_type=upload tanpa file "photo" = foto lama dipertahankan (Edit user).
 * password hanya dikirim kalau diisi.
 */
export function buildUserFormData(values, photo) {
  const form = new FormData();
  form.append("full_name", values.fullName.trim());
  form.append("level", values.level);
  form.append("username", values.username.trim());
  if (values.password) form.append("password", values.password);
  form.append("photo_type", photo.mode);
  if (photo.mode === "upload" && photo.blob) form.append("photo", photo.blob, "avatar.jpg");
  if (photo.mode === "initials") form.append("avatar_color", getAvatarColor(values.fullName));
  return form;
}
