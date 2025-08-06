// src/header.jsx
import { Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./UserContext.jsx";
import { useCart } from "./context/CartContext.jsx";

export default function Header() {
  const { user } = useContext(UserContext);
  const { totalCount } = useCart();
7, 44, 655; 
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2"
          aria-label="Go to homepage"
        >
          <span className="font-serif text-3xl tracking-tight text-neutral-900">
            Artisan.
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Search (placeholder button – wire up later) */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white p-2 text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500/30"
            aria-label="Search"
            title="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.65 7.65 0 105.4 5.4a7.65 7.65 0 001.8 10.2z"
              />
            </svg>
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white p-2 text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500/30"
            aria-label="Cart"
            title="Cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386a1.125 1.125 0 011.063.78l.383 1.151m0 0L6.75 12.75h10.5l2.25-6.75H5.082z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 21a.75.75 0 100-1.5.75.75 0 000 1.5zm9 0a.75.75 0 100-1.5.75.75 0 000 1.5z"
              />
            </svg>
            {totalCount > 0 && (
              <span
                className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-medium text-white"
                aria-label={`${totalCount} items in cart`}
              >
                {totalCount}
              </span>
            )}
          </Link>

          {/* Profile / Auth */}
          <Link
            to={user ? "/account" : "/login"}
            className="group inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500/30"
            aria-label={user ? "Account" : "Sign in"}
          >
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
              {/* Simple avatar glyph */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-neutral-600"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 6.75a3 3 0 100 6 3 3 0 000-6zM4.5 18.75a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            {user && (
              <span className="hidden sm:inline text-neutral-800 group-hover:text-neutral-900">
                {user.name}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
