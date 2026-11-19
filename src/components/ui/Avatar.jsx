import Icon from "../Icon";
import { getAvatarColor, getInitials } from "../../services/avatar";

// Avatar bulat: foto kalau ada, kalau tidak inisial berwarna dari nama.
// Bisa dipakai juga di Header & User list supaya warnanya konsisten.
export default function Avatar({ name = "", src, size = 56, className = "" }) {
  const initials = getInitials(name);
  const style = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `Photo of ${name}` : "Profile photo"}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name ? `Initials of ${name}` : "No name yet"}
      style={{ ...style, backgroundColor: initials ? getAvatarColor(name) : undefined }}
      className={`grid shrink-0 place-items-center rounded-full font-medium text-white select-none ${
        initials ? "" : "bg-gray-100 text-gray-400"
      } ${className}`}
    >
      {initials ? (
        <span style={{ fontSize: size * 0.36 }}>{initials}</span>
      ) : (
        <Icon name="user" className="size-1/2" />
      )}
    </span>
  );
}
