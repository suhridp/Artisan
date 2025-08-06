// src/pages/registerpage.jsx
import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import api from "../lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function registerUser(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post("/register", { name, email, password });
      setDone(true);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data ||
        "Registration failed. Please try again.";
      setError(typeof msg === "string" ? msg : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <Navigate to="/login" replace />;

  return (
    <section className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center font-serif text-3xl tracking-tight text-neutral-900">
          Create account
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500">
          Join to manage your orders and products.
        </p>

        <form onSubmit={registerUser} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="Your full name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="you@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <p className="mt-1 text-xs text-neutral-500">
              Use at least 6 characters for a stronger password.
            </p>
          </div>

          <button
            disabled={submitting}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Already a member?{" "}
          <Link
            to="/login"
            className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
