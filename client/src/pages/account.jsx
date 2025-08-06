// src/pages/account.jsx
import { useContext, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../UserContext.jsx";
import ProductsPage from "./productspage.jsx";
import AccountNav from "../accountnav.jsx";
import api from "../lib/api";

export default function AccountPage() {
  const [redirect, setRedirect] = useState(null);
  const navigate = useNavigate();
  const { ready, user, setUser } = useContext(UserContext);
  const { subpage: rawSubpage } = useParams();

  const subpage = rawSubpage ?? "profile";

  async function logout() {
    try {
      await api.post("/logout");
    } finally {
      setUser(null);
      navigate("/", { replace: true });
    }
  }

  if (!ready) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-neutral-200 bg-white p-8">
          <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 h-4 w-64 animate-pulse rounded bg-neutral-100" />
        </div>
      </section>
    );
  }

  if (ready && !user && !redirect) {
    return <Navigate to="/login" replace />;
  }

  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  return (
    <section className="space-y-8">
      {/* Quiet, centered sub-nav */}
      <div className="border-b border-neutral-200 pb-2">
        <AccountNav />
      </div>

      {subpage === "profile" && (
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-[1fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
            <header className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <span className="text-sm font-medium">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h1 className="font-serif text-2xl leading-tight tracking-tight text-neutral-900">
                  My Profile
                </h1>
                <p className="text-sm text-neutral-500">
                  Signed in as{" "}
                  <span className="font-medium text-neutral-700">
                    {user?.name}
                  </span>{" "}
                  (<span className="text-neutral-700">{user?.email}</span>)
                </p>
              </div>
            </header>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/account/products"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 transition hover:bg-neutral-50"
              >
                View my products
              </Link>
              <Link
                to="/account/orders"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 transition hover:bg-neutral-50"
              >
                View my orders
              </Link>
              <button
                onClick={logout}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition hover:bg-neutral-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {(subpage === "products" || subpage === "places") && (
        <div className="mx-auto max-w-7xl">
          {/* Optional section heading for cohesion */}
          <h2 className="mb-3 font-serif text-2xl tracking-tight text-neutral-900">
            My Products
          </h2>
          <ProductsPage />
        </div>
      )}
    </section>
  );
}
