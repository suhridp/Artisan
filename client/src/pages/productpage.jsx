// src/pages/productpage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import BookingWidget from "../bookingwidget.jsx";
import api from "../lib/api";
import { useCart } from "../context/CartContext.jsx";

const fmtINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ProductPage() {
  const { id } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const firstLoadRef = useRef(true);

  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        if (active) setProduct(data);
      } catch (e) {
        if (active) setErr("Failed to load product");
      } finally {
        if (active) {
          setLoading(false);
          firstLoadRef.current = false;
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // Page title
  useEffect(() => {
    if (product?.title) {
      const prev = document.title;
      document.title = `${product.title} — Crafted, quietly`;
      return () => {
        document.title = prev;
      };
    }
  }, [product?.title]);

  // --- Fullscreen photo viewer ---
  if (showAllPhotos && product) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
          <h2 className="font-serif text-xl tracking-tight text-neutral-900">
            Photos · {product.title || "Untitled"}
          </h2>
          <button
            onClick={() => setShowAllPhotos(false)}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 transition hover:bg-neutral-50"
            aria-label="Close photo viewer"
          >
            Close
          </button>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {product?.photos?.map((photo, i) => (
            <img
              key={`${photo}-${i}`}
              src={`${base}/uploads/${photo}`}
              alt={product.title || "Product photo"}
              className="h-full w-full rounded-lg border border-neutral-200 bg-white object-cover"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    );
  }

  // --- Loading skeleton ---
  if (loading) {
    return (
      <section className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-neutral-200" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-neutral-200" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-lg bg-neutral-200"
                />
              ))}
            </div>
          </div>
          <div className="h-[420px] animate-pulse rounded-lg bg-neutral-200" />
        </div>
      </section>
    );
  }

  if (err) {
    return (
      <section className="space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-red-600">
          {err}
        </div>
      </section>
    );
  }

  if (!product) return null;

  const mainImg = product.photos?.[0]
    ? `${base}/uploads/${product.photos[0]}`
    : null;
  const thumbs = product.photos?.slice(1, 4) || [];

  const stock = typeof product.stock === "number" ? product.stock : 0;
  const inStock = stock > 0;
  const category = product.category ?? product.catagory ?? "Uncategorized";

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-4xl leading-tight tracking-tight text-neutral-900">
          {product.title || "Untitled"}
        </h1>
        {product.owneraddress && (
          <a
            className="inline-flex items-center gap-2 text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-800"
            target="_blank"
            rel="noreferrer"
            href={`https://maps.google.com/?q=${encodeURIComponent(
              product.owneraddress
            )}`}
            title="Open in Google Maps"
          >
            {product.owneraddress}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
            </svg>
          </a>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* --- Left: gallery --- */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            {mainImg ? (
              <img
                onClick={() => setShowAllPhotos(true)}
                src={mainImg}
                alt={product.title || "Product image"}
                className="w-full cursor-zoom-in object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-neutral-400">
                No image
              </div>
            )}
          </div>

          {thumbs.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {thumbs.map((ph, i) => (
                <button
                  key={`${ph}-${i}`}
                  onClick={() => setShowAllPhotos(true)}
                  className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
                  title="View all photos"
                  aria-label="View all photos"
                >
                  <img
                    src={`${base}/uploads/${ph}`}
                    alt=""
                    className="h-36 w-full cursor-zoom-in object-cover transition"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {product.photos?.length > 3 && (
            <button
              onClick={() => setShowAllPhotos(true)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 transition hover:bg-neutral-50"
            >
              Show all photos
            </button>
          )}
        </div>

        {/* --- Right: details + checkout --- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-medium text-neutral-900">
                {fmtINR.format(product.price || 0)}
              </div>
              <div
                className={`text-sm ${
                  inStock ? "text-emerald-700" : "text-neutral-500"
                }`}
                aria-live="polite"
              >
                {inStock ? `In stock (${stock})` : "Out of stock"}
              </div>
            </div>

            <div className="space-y-4 text-neutral-700">
              {product.description && (
                <section>
                  <h2 className="mb-1 font-serif text-xl tracking-tight text-neutral-900">
                    Description
                  </h2>
                  <p className="whitespace-pre-line text-neutral-700">
                    {product.description}
                  </p>
                </section>
              )}

              {product.history && (
                <section>
                  <h2 className="mb-1 font-serif text-xl tracking-tight text-neutral-900">
                    History
                  </h2>
                  <p className="whitespace-pre-line text-neutral-700">
                    {product.history}
                  </p>
                </section>
              )}

              {product.artistdes && (
                <section>
                  <h2 className="mb-1 font-serif text-xl tracking-tight text-neutral-900">
                    Artist
                  </h2>
                  <p className="whitespace-pre-line text-neutral-700">
                    {product.artistdes}
                  </p>
                </section>
              )}

              <section className="text-sm text-neutral-600">
                <div>
                  <span className="font-medium text-neutral-800">
                    Category:
                  </span>{" "}
                  {category}
                </div>
                <div>
                  <span className="font-medium text-neutral-800">Stock:</span>{" "}
                  {typeof stock === "number" ? stock : "—"}
                </div>

                {Array.isArray(product.perks) && product.perks.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-neutral-700">
                    {product.perks.map((perk, i) => (
                      <li key={`${perk}-${i}`}>{perk}</li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Add to cart */}
            <button
              onClick={() => inStock && add(product._id, 1)}
              disabled={!inStock}
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-60"
            >
              {inStock ? "Add to cart" : "Out of stock"}
            </button>

            {/* Checkout / booking widget */}
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <BookingWidget product={product} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
