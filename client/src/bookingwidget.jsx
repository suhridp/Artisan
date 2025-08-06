// src/bookingwidget.jsx
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { UserContext } from "./UserContext.jsx";
import api from "./lib/api";

const fmtINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// --- Razorpay script loader (singleton) ---
let rzpPromise;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (rzpPromise) return rzpPromise;

  rzpPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });

  return rzpPromise;
}

export default function BookingWidget({ product }) {
  const { user } = useContext(UserContext);
  const [home_address, setHomeAddress] = useState("");
  const [contact_no, setContactNo] = useState("");
  const [items, setItems] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [redirect, setRedirect] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(""); // non-error status
  const openedRef = useRef(false); // prevent double-open

  const priceTotal = useMemo(() => {
    return Math.max(0, Number(items || 0)) * Number(product?.price || 0) || 0;
  }, [items, product?.price]);

  const stock = typeof product?.stock === "number" ? product.stock : 0;
  const inStock = stock > 0;

  // Optional: hydrate contact + address from previous attempt (local memory)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("checkoutContact") || "{}");
      if (saved.home_address) setHomeAddress(saved.home_address);
      if (saved.contact_no) setContactNo(saved.contact_no);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "checkoutContact",
        JSON.stringify({ home_address, contact_no })
      );
    } catch {}
  }, [home_address, contact_no]);

  // Clamp qty to [1, stock] (if stock > 0). If no stock number, keep >= 1.
  useEffect(() => {
    if (!Number.isFinite(items)) return;
    if (inStock) {
      if (items < 1) setItems(1);
      if (items > stock) setItems(stock);
    } else if (items < 1) {
      setItems(1);
    }
  }, [items, inStock, stock]);

  function validate() {
    if (!user) return "Please login to place an order.";
    if (!inStock) return "This item is currently out of stock.";
    if (!home_address?.trim()) return "Please enter your delivery address.";
    const phone = (contact_no || "").replace(/\D/g, "");
    if (!/^\d{10}$/.test(phone))
      return "Please enter a valid 10-digit mobile number.";
    if (!Number.isFinite(items) || Number(items) < 1)
      return "Please enter a valid quantity.";
    if (inStock && Number(items) > stock) return `Only ${stock} in stock.`;
    return "";
  }

  async function buyThisProduct() {
    setError("");
    setInfo("");
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setSubmitting(true);
      setInfo("Starting checkout…");

      // 1) Create order session on server
      const { data } = await api.post("/checkout", {
        productId: product._id,
        items,
        home_address,
        contact_no,
      });

      // Expecting: { razorpayOrder, key, amount, currency, orderId }
      const { razorpayOrder, key, amount, currency, orderId } = data || {};
      if (!razorpayOrder?.id || !key) {
        throw new Error("Invalid checkout session");
      }

      // 2) Ensure Razorpay is available
      await loadRazorpay();

      if (openedRef.current) return; // already opened
      openedRef.current = true;

      const rzp = new window.Razorpay({
        key,
        amount: razorpayOrder.amount ?? amount,
        currency: currency || "INR",
        name: "Artisan",
        description: product?.title || "Order",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          // Optionally call server to verify signature:
          // await api.post('/verify-payment', { orderId, ...response })
          setInfo("Payment successful. Redirecting…");
          setRedirect(`/account/orders/${orderId}`);
        },
        modal: {
          ondismiss: function () {
            openedRef.current = false;
            setInfo("");
          },
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: contact_no,
        },
        notes: {
          productId: product?._id,
        },
        theme: { color: "#111111" },
      });

      rzp.on("payment.failed", function () {
        openedRef.current = false;
        setError("Payment failed or was cancelled. Please try again.");
      });

      rzp.open();
    } catch (e) {
      console.error(e);
      setError(
        e?.message?.includes("Razorpay")
          ? "Could not load payment. Check your connection and try again."
          : "Could not start checkout. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (redirect) return <Navigate to={redirect} replace />;

  return (
    <div className="space-y-4">
      {/* Price row */}
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-medium text-neutral-900">
          {fmtINR.format(product?.price || 0)}
        </div>
        {items > 0 && (
          <div className="text-sm text-neutral-600">
            Total:{" "}
            <span className="font-medium text-neutral-900">
              {fmtINR.format(priceTotal)}
            </span>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{" "}
          {!user && (
            <>
              <span className="mx-1">•</span>
              <Link to="/login" className="underline underline-offset-2">
                Sign in
              </Link>
            </>
          )}
        </div>
      )}
      {info && !error && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          {info}
        </div>
      )}

      {/* Form */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Home address
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            value={home_address}
            onChange={(e) => setHomeAddress(e.target.value)}
            placeholder="Flat, street, landmark, city, PIN"
            autoComplete="street-address"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Contact number
            </label>
            <input
              type="tel"
              inputMode="tel"
              pattern="\d{10}"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              value={contact_no}
              onChange={(e) =>
                setContactNo(e.target.value.replace(/[^\d]/g, "").slice(0, 10))
              }
              placeholder="10-digit mobile"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              max={inStock ? stock : undefined}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              value={items}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                if (inStock) {
                  setItems(Math.max(1, Math.min(v, stock)));
                } else {
                  setItems(Math.max(1, v));
                }
              }}
            />
            {inStock && (
              <p className="mt-1 text-xs text-neutral-500">
                {stock} {stock === 1 ? "unit" : "units"} in stock
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={buyThisProduct}
        disabled={submitting || !inStock}
        className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {submitting ? "Processing…" : inStock ? "Buy now" : "Out of stock"}
        {items > 0 && inStock && (
          <span className="ml-1">· {fmtINR.format(priceTotal)}</span>
        )}
      </button>

      {/* Helper text */}
      <p className="text-xs text-neutral-500">
        By placing this order, you agree to our terms. You’ll receive a
        confirmation in your orders.
      </p>
    </div>
  );
}
