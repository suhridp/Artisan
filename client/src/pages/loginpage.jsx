// src/pages/loginpage.jsx
import { Link, Navigate } from "react-router-dom";
import { useContext, useState } from "react";
import { UserContext } from "../UserContext.jsx";
import api from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useContext(UserContext);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/login", { email, password });
      setUser(data);
      setRedirect(true);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data ||
        "Login failed. Please check your credentials.";
      setError(typeof msg === "string" ? msg : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (redirect) return <Navigate to="/" />;

  return (
    <section className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 font-serif text-3xl tracking-tight text-neutral-900 text-center">
          Welcome back
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500">
          Sign in to continue your journey.
        </p>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

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
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            disabled={submitting}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Don’t have an account?{" "}
          <Link
            className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
            to="/register"
          >
            Register
          </Link>
        </p>
      </div>
    </section>
  );
}
