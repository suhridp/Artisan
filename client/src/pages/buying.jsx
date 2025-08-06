// src/pages/buying.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function BuyingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  function goBack() {
    if (busy) return;
    setBusy(true);
    navigate("/account", { replace: true });
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded-xl border border-neutral-200 bg-white p-10 shadow-sm">
        <h1 className="mb-4 font-serif text-2xl tracking-tight text-neutral-900">
          Order Confirmed
        </h1>
        <p className="mb-8 text-neutral-600">
          Your order has been placed successfully.
        </p>

        <div className="mb-6 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
          <span className="font-medium">Booking ID:</span> {id}
        </div>

        <button
          onClick={goBack}
          disabled={busy}
          className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          Back to Account
        </button>
      </div>
    </section>
  );
}
