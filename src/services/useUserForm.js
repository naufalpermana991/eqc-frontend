import { useEffect, useRef, useState } from "react";
import { validateUser } from "./userForm";

// State form user (Add & Edit): nilai field, foto, touched/submitted, dirty, reset.
// `initial` hanya dibaca saat mount — beri `key` berbeda pada komponen untuk user lain.
function initialState(initial) {
  return {
    values: {
      fullName: initial.fullName ?? "",
      level: initial.level ?? "",
      username: initial.username ?? "",
      password: "", // password lama TIDAK PERNAH ditampilkan
    },
    photo: {
      mode: initial.photoUrl ? "upload" : "initials",
      blob: null, // hanya terisi kalau user upload foto baru
      url: initial.photoUrl ?? "",
    },
  };
}

export function useUserForm(initial, { passwordRequired = true } = {}) {
  const [start] = useState(() => initialState(initial));
  const [values, setValues] = useState(start.values);
  const [photo, setPhoto] = useState(start.photo);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({}); // error dari API, mis. username sudah dipakai
  const createdUrl = useRef("");

  // Lepas object URL buatan kita saat diganti / komponen ditutup
  const releaseUrl = () => {
    if (createdUrl.current) URL.revokeObjectURL(createdUrl.current);
    createdUrl.current = "";
  };
  useEffect(() => releaseUrl, []);

  const errors = validateUser(values, { passwordRequired });
  const showError = (name) => serverErrors[name] || ((touched[name] || submitted) && errors[name]) || "";

  const filledRequired =
    values.fullName.trim() && values.level && values.username.trim() && (!passwordRequired || values.password);

  const dirty =
    Object.keys(values).some((k) => values[k] !== start.values[k]) ||
    photo.mode !== start.photo.mode ||
    photo.url !== start.photo.url;

  return {
    values,
    photo,
    errors,
    showError,
    filledRequired: Boolean(filledRequired),
    dirty,
    isValid: Object.keys(errors).length === 0,

    setField: (name, value) => {
      setValues((v) => ({ ...v, [name]: value }));
      setServerErrors((e) => (e[name] ? { ...e, [name]: "" } : e)); // error server hilang saat diketik ulang
    },
    setServerError: (name, message) => setServerErrors((e) => ({ ...e, [name]: message })),
    blurField: (name) => setTouched((t) => ({ ...t, [name]: true })),

    setPhotoMode: (mode) => setPhoto((p) => ({ ...p, mode })),
    setUploadedPhoto: (blob) => {
      releaseUrl();
      const url = URL.createObjectURL(blob);
      createdUrl.current = url;
      setPhoto({ mode: "upload", blob, url });
    },
    removePhoto: () => {
      releaseUrl();
      setPhoto({ mode: "initials", blob: null, url: "" });
    },

    /** Kembali ke nilai awal (Add: kosong, Edit: data user semula). */
    reset: () => {
      releaseUrl();
      setValues(start.values);
      setPhoto(start.photo);
      setTouched({});
      setSubmitted(false);
      setServerErrors({});
    },

    /** Tandai submitted (tampilkan semua error); return true kalau valid. */
    submit: () => {
      setSubmitted(true);
      return Object.keys(errors).length === 0;
    },
  };
}
