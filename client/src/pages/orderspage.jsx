// src/pages/orderspage.jsx
import AccountNav from "../accountnav.jsx";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

const fmtINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/orders");
        if (active) setOrders(data || []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section>
        <AccountNav />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!orders.length) {
    return (
      <section>
        <AccountNav />
        <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-8 text-center text-neutral-600">
          You haven’t placed any orders yet.
        </div>
      </section>
    );
  }

  return (
    <section>
      <AccountNav />
      <h1 className="mb-4 mt-6 font-serif text-2xl tracking-tight text-neutral-900">
        My Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            to={`/account/orders/${order._id}`}
            key={order._id}
            className="block transition hover:-translate-y-0.5"
          >
            <article className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-700">
                  Order ID:{" "}
                  <span className="text-neutral-900">{order._id}</span>
                </div>
                <div className="text-sm text-neutral-500">
                  {order.items} item{order.items > 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-3 space-y-1 text-sm text-neutral-600">
                <div>
                  <span className="font-medium">Shipping:</span>{" "}
                  {order.home_address}
                </div>
                <div>
                  <span className="font-medium">Contact:</span>{" "}
                  {order.contact_no}
                </div>
                <div className="pt-1 font-semibold text-neutral-900">
                  {fmtINR.format(order.price || 0)}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
