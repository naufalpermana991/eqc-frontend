import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import UserFormFields from "../../components/UserFormFields";
import SuccessDialog from "../../components/SuccessDialog";
import Button from "../../components/ui/Button";
import { useUserForm } from "../../services/useUserForm";
import { EMPTY_USER, buildUserFormData } from "../../services/userForm";
import { createUser } from "../../services/userApi";
import { LEVEL_LABEL } from "../../config/userLevels";

// Figma: UI Design 1 → Admin → Add user
// Foto profil: pilih INISIAL (default) atau UPLOAD foto. User id dibuat otomatis oleh backend (sementara: mock API).
export default function AddUser() {
  const form = useUserForm(EMPTY_USER, { passwordRequired: true });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null); // user yang baru dibuat → tampilkan modal sukses
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // "Add another user": tutup modal, form sudah kosong → langsung siap diisi
  function addAnother() {
    setCreated(null);
    requestAnimationFrame(() => document.getElementById("add-fullName")?.focus());
  }

  async function onSubmit(e) {
    e.preventDefault();
    setCreated(null);
    setError("");
    if (!form.submit()) return;

    setSaving(true);
    try {
      const user = await createUser(buildUserFormData(form.values, form.photo));
      setCreated(user);
      form.reset(); // form kosong lagi, siap untuk user berikutnya
    } catch (err) {
      if (err.field) form.setServerError(err.field, err.message);
      else setError(err.message || "Failed to save user. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Add user"
        description="Input form below to add user manager, supervisor and operator"
      />

      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-xl bg-white p-6 shadow-xs"
      >
        <UserFormFields form={form} idPrefix="add" />

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <Button
            onClick={() => {
              form.reset();
              setError("");
            }}
            disabled={!form.dirty || saving}
            className="h-12 px-5 text-base disabled:text-gray-300"
          >
            Reset all
          </Button>
          <div className="flex items-center gap-4">
            {error && (
              <p role="alert" className="text-sm text-error-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!form.filledRequired || saving}
              className="inline-flex h-12 items-center rounded-lg bg-error-600 px-5 text-base font-semibold text-white shadow-xs focus:outline-none focus-visible:shadow-focus-error enabled:hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-brand-200"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>

      {created && (
        <SuccessDialog
          title="User created"
          message={`${created.name} has been added successfully.`}
          secondaryLabel="Add another user"
          onSecondary={addAnother}
          primaryLabel="View user list"
          onPrimary={() => navigate("/users")}
        >
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <dt className="text-gray-500">User id</dt>
            <dd className="font-semibold text-gray-900">{created.id}</dd>
            <dt className="text-gray-500">Username</dt>
            <dd className="text-gray-900">{created.username}</dd>
            <dt className="text-gray-500">User level</dt>
            <dd className="text-gray-900">{LEVEL_LABEL[created.level]}</dd>
          </dl>
        </SuccessDialog>
      )}
    </>
  );
}
