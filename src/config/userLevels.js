// Level user — satu sumber untuk form Add user, filter, dan tabel User list.
export const USER_LEVELS = [
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operator", label: "Operator" },
];

export const LEVEL_LABEL = Object.fromEntries(USER_LEVELS.map((l) => [l.value, l.label]));
