import { createContext, useContext } from "react";

// Toast = notifikasi singkat yang hilang sendiri (±5 detik). Provider-nya di components/ToastProvider.jsx.
// Pakai untuk aksi rutin (edit, hapus). JANGAN untuk info yang harus dibaca/dicatat — pakai modal.
//
//   const toast = useToast();
//   toast.success("User updated.");
//   toast.error("Failed to delete user.");
export const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() must be used inside <ToastProvider>.");
  return ctx;
}
