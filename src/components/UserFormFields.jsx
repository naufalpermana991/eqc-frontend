import { useState } from "react";
import PhotoPicker from "./PhotoPicker";
import Icon from "./Icon";
import FormField from "./ui/FormField";
import { inputClass } from "./ui/inputStyles";
import { USER_LEVELS } from "../config/userLevels";

/**
 * Isi form user (foto + field) — dipakai halaman Add user dan modal Edit user.
 * `form` = hasil useUserForm(). `idPrefix` membedakan id input kalau dua form ada di DOM.
 */
export default function UserFormFields({
  form,
  userId = "",
  passwordHint,
  passwordPlaceholder = "Enter password",
  idPrefix = "user",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const { values, showError, setField, blurField } = form;
  const id = (name) => `${idPrefix}-${name}`;

  const textProps = (name) => ({
    id: id(name),
    value: values[name],
    onChange: (e) => setField(name, e.target.value),
    onBlur: () => blurField(name),
    "aria-invalid": Boolean(showError(name)),
    "aria-describedby": showError(name) ? `${id(name)}-error` : undefined,
  });

  return (
    <>
      <PhotoPicker
        name={values.fullName}
        photo={form.photo}
        onModeChange={form.setPhotoMode}
        onUpload={form.setUploadedPhoto}
        onRemove={form.removePhoto}
      />

      <div className="mt-6 flex flex-col gap-5">
        <FormField
          id={id("id")}
          label="User id"
          hint={userId ? "User id cannot be changed." : "Generated automatically after saving."}
        >
          <input
            id={id("id")}
            disabled
            value={userId}
            placeholder="Auto-generated user id"
            className={inputClass(false)}
          />
        </FormField>

        <FormField id={id("fullName")} label="Full name" error={showError("fullName")}>
          <input
            {...textProps("fullName")}
            placeholder="Enter full name"
            autoComplete="off"
            className={inputClass(showError("fullName"))}
          />
        </FormField>

        <FormField id={id("level")} label="User level" error={showError("level")}>
          <span className="relative">
            <select
              {...textProps("level")}
              className={`${inputClass(showError("level"), { muted: !values.level })} cursor-pointer appearance-none pr-10`}
            >
              <option value="" disabled>
                Select user level
              </option>
              {USER_LEVELS.map((l) => (
                <option key={l.value} value={l.value} className="text-gray-900">
                  {l.label}
                </option>
              ))}
            </select>
            <Icon
              name="chevron-down"
              className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-gray-500"
            />
          </span>
        </FormField>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField id={id("username")} label="Username" error={showError("username")}>
            <input
              {...textProps("username")}
              placeholder="Enter username"
              autoComplete="off"
              className={inputClass(showError("username"))}
            />
          </FormField>

          <FormField id={id("password")} label="Password" error={showError("password")} hint={passwordHint}>
            <span className="relative">
              <input
                {...textProps("password")}
                type={showPassword ? "text" : "password"}
                placeholder={passwordPlaceholder}
                autoComplete="new-password"
                className={`${inputClass(showError("password"))} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:shadow-focus-gray"
              >
                <Icon name={showPassword ? "eye-slash" : "eye"} className="size-5" />
              </button>
            </span>
          </FormField>
        </div>
      </div>
    </>
  );
}
