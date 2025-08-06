// src/pages/productspage.jsx
import AccountNav from "../accountnav.jsx";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

const fmtINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });
  const [deletingIds, setDeletingIds] = useState(new Set());
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";

  async function load() {
    setState((s) => ({ ...s, loading: true, error: "" }));
    let active = true;
    try {
      const { data } = await api.get("/user-products"); // returns array
      if (active) setProducts(Array.isArray(data) ? data : []);
    } catch {
      if (active) setState((s) => ({ ...s, error: "Failed to load products" }));
    } finally {
      if (active) setState((s) => ({ ...s, loading: false }));
    }
    return () => {
      active = false;
    };
  }

  useEffect(() => {
    let cleanup = load();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  async function handleDelete(id) {
    if (!id) return;
    const confirmMsg = "Delete this product? This cannot be undone.";
    if (!window.confirm(confirmMsg)) return;

    // optimistic UI
    setDeletingIds((prev) => new Set(prev).add(id));
    const prev = products;
    setProducts((list) => list.filter((p) => p._id !== id));

    try {
      await api.delete(`/products/${id}`);
    } catch (e) {
      // rollback on failure
      setProducts(prev);
      alert("Could not delete the product. Please try again.");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-neutral-200 pb-2">
        <AccountNav />
      </div>

      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-neutral-900">
            My Products
          </h1>
          <p className="text-sm text-neutral-600">
            Create and manage your catalogue.
          </p>
        </div>
        <Link
          to="/account/products/new"
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
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
              d="M12 4.5v15M19.5 12h-15"
            />
          </svg>
          Add product
        </Link>
      </header>

      {/* Loading */}
      {state.loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
            >
              <div className="h-44 w-full animate-pulse bg-neutral-100" />
              <div className="p-4">
                <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-100" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!state.loading && state.error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{state.error}</span>
          <button
            onClick={load}
            className="rounded border border-red-300 bg-white px-3 py-1 text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!state.loading && !state.error && products.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-neutral-600">
          You haven’t added any products yet.
          <div className="mt-4">
            <Link
              to="/account/products/new"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              Add your first product
            </Link>
          </div>
        </div>
      )}

      {/* Grid */}
      {!state.loading && !state.error && products.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const thumb = p?.photos?.[0]
              ? `${base}/uploads/${p.photos[0]}`
              : null;
            const price = fmtINR.format(p?.price || 0);
            const stock = typeof p?.stock === "number" ? p.stock : 0;
            const deleting = deletingIds.has(p._id);

            return (
              <article
                key={p._id}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
              >
                <Link
                  to={`/account/products/${p._id}`}
                  className="block h-44 w-full bg-neutral-100"
                  title="Edit product"
                >
                  {thumb ? (
                    <img
                      className="h-full w-full object-cover transition duration-200 hover:scale-[1.02]"
                      src={thumb}
                      alt={p?.title || "Product image"}
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                      No image
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  <h2 className="line-clamp-1 font-serif text-lg leading-tight text-neutral-900">
                    {p?.title || "Untitled"}
                  </h2>

                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-900">
                      {price}
                    </span>
                    <span
                      className={
                        stock > 0 ? "text-neutral-600" : "text-neutral-500"
                      }
                    >
                      {stock > 0 ? `Stock: ${stock}` : "Out of stock"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      to={`/account/products/${p._id}`}
                      className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-neutral-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p._id)}
                      disabled={deleting}
                      className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-60"
                      aria-busy={deleting ? "true" : "false"}
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                    <Link
                      to={`/products/${p._id}`}
                      className="ml-auto inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 transition hover:bg-neutral-50"
                      title="View on storefront"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
