// src/pages/indexpage.jsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

const fmtINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function IndexPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true); // for any fetch
  const [error, setError] = useState(""); // request error
  const firstLoadRef = useRef(true); // detect initial load

  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";

  async function load(nextPage = 1, { replace = false } = {}) {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/products", {
        params: { page: nextPage, limit: 24 },
      });

      const newItems = data?.items || [];
      setItems((prev) => (replace ? newItems : [...prev, ...newItems]));
      setPage(data?.page ?? nextPage);
      setPages(data?.pages ?? 1);
    } catch (e) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
      firstLoadRef.current = false;
    }
  }

  useEffect(() => {
    load(1, { replace: true });
    // no cleanup needed because we don't keep pending promises in state
  }, []);

  const initialLoading = firstLoadRef.current && loading;

  return (
    <section className="space-y-8">
      <HeaderIntro />

      {/* Error */}
      {error && !initialLoading && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-red-600">
          {error}
        </div>
      )}

      {/* Initial skeleton */}
      {initialLoading && <SkeletonGrid count={8} />}

      {/* Empty state (after initial load) */}
      {!initialLoading && !error && items.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-neutral-600">
          Nothing here yet. Add your first product from{" "}
          <span className="font-medium">Account → My Products</span>.
        </div>
      )}

      {/* Grid */}
      {!initialLoading && items.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => {
              const photo = p?.photos?.[0];
              const img = photo ? `${base}/uploads/${photo}` : null;
              return (
                <Link
                  to={`/products/${p._id}`}
                  key={p._id}
                  className="group block"
                >
                  <article className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
                    <div className="aspect-[4/5] bg-neutral-100">
                      {img ? (
                        <img
                          src={img}
                          alt={p?.title || "Product image"}
                          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-1 font-serif text-xl leading-tight tracking-tight text-neutral-900">
                        {p?.title || "Untitled"}
                      </h3>
                      <div className="mt-1 text-sm text-neutral-600">
                        {fmtINR.format(p?.price || 0)}
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          {/* Load more */}
          <div className="flex justify-center">
            {page < pages && (
              <button
                disabled={loading}
                onClick={() => load(page + 1)}
                className="rounded-lg border border-neutral-300 bg-white px-5 py-2 text-sm transition hover:bg-neutral-50 disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            )}
            {page >= pages && !loading && (
              <div className="text-neutral-600">You’ve reached the end.</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function HeaderIntro() {
  return (
    <header className="space-y-3">
      <h1 className="font-serif text-4xl leading-tight tracking-tight text-neutral-900">
        Crafted, quietly
      </h1>
      <p className="max-w-2xl text-neutral-600">
        A curated selection of artisan-made pieces. Neutral tones, timeless
        forms, made to last.
      </p>
    </header>
  );
}

function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
        >
          <div className="aspect-[4/5] animate-pulse bg-neutral-100" />
          <div className="p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-100" />
            <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
