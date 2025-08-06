import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import api from "../lib/api";

const fmtINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const base = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function CartPage() {
  const { items, setQty, remove, clear } = useCart();
  const [snap, setSnap] = useState([]); // hydrated products
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [redirect, setRedirect] = useState("");

  // Hydrate product details for items
  useEffect(() => {
    let active = true;
    (async () => {
      if (!items.length) {
        setSnap([]);
        return;
      }
      // Fetch details for all productIds present in cart
      // (since no batch endpoint, make one call per id – OK for phase 2)
      const results = await Promise.all(
        items.map((i) =>
          api.get(`/products/${i.productId}`).then((r) => r.data)
        )
      );
      if (active) setSnap(results);
    })();
    return () => {
      active = false;
    };
  }, [items]);

  const lines = useMemo(() => {
    const map = new Map(snap.map((p) => [p._id, p]));
    return items.map((i) => {
      const p = map.get(i.productId);
      const price = p?.price || 0;
      const subtotal = price * i.qty;
      return { ...i, product: p, price, subtotal };
    });
  }, [items, snap]);

  const total = lines.reduce((n, l) => n + l.subtotal, 0);

  async function checkout() {
    if (!address.trim() || !phone.trim() || !lines.length) return;
    setBusy(true);
    try {
      const cartItems = lines.map((l) => ({
        productId: l.product._id,
        qty: l.qty,
      }));
      const { data } = await api.post("/checkout/razorpay", {
        cartItems,
        home_address: address.trim(),
        contact_no: phone.trim(),
      });

      // Load Razorpay script if not present
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Artisan",
        description: "Order payment",
        order_id: data.orderId,
        prefill: { contact: phone },
        notes: { address },
        theme: { color: "#111111" },
        handler: async function (response) {
          // Verify on server
          await api.post("/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          clear();
          setRedirect("/account/orders");
        },
        modal: {
          ondismiss: function () {
            // user closed checkout
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      alert(e?.response?.data?.error || "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  if (redirect) return <Navigate to={redirect} replace />;

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-3xl">Cart</h1>

      {!lines.length ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-neutral-600">
          Your cart is empty.{" "}
          <Link to="/" className="underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {lines.map((l) => (
              <div
                key={l.productId}
                className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-3"
              >
                <div className="h-20 w-20 overflow-hidden rounded bg-neutral-100">
                  {l.product?.photos?.[0] ? (
                    <img
                      src={`${base}/uploads/${l.product.photos[0]}`}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{l.product?.title}</div>
                  <div className="text-sm text-neutral-600">
                    {fmtINR.format(l.price)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={l.qty}
                    onChange={(e) =>
                      setQty(l.productId, Number(e.target.value))
                    }
                    className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm"
                  />
                  <div className="w-24 text-right font-medium">
                    {fmtINR.format(l.subtotal)}
                  </div>
                </div>
                <button
                  onClick={() => remove(l.productId)}
                  className="rounded border border-neutral-300 px-2 py-1 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
              <h2 className="font-medium">Shipping</h2>
              <input
                type="text"
                placeholder="Full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium">{fmtINR.format(total)}</span>
              </div>
              <button
                onClick={checkout}
                disabled={busy || !address || !phone}
                className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {busy ? "Processing…" : "Checkout"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
