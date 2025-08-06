// src/accountnav.jsx
import { NavLink } from "react-router-dom";

export default function AccountNav() {
  const base =
    "px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200";
  const active = "bg-neutral-900 text-white shadow-sm";
  const idle =
    "bg-white text-neutral-800 border border-neutral-300 hover:border-neutral-500 hover:text-neutral-900";

  return (
    <nav className="mx-auto my-4 flex w-full max-w-3xl justify-center gap-3">
      <NavLink
        to="/"
        className={({ isActive }) => `${base} ${isActive ? active : idle}`}
        end
      >
        Home
      </NavLink>

      <NavLink
        to="/account"
        className={({ isActive }) => `${base} ${isActive ? active : idle}`}
        end
      >
        My Profile
      </NavLink>

      <NavLink
        to="/account/orders"
        className={({ isActive }) => `${base} ${isActive ? active : idle}`}
      >
        My Orders
      </NavLink>

      <NavLink
        to="/account/products"
        className={({ isActive }) => `${base} ${isActive ? active : idle}`}
      >
        My Products
      </NavLink>
    </nav>
  );
}
