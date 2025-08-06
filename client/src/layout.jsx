// src/layout.jsx
import { Outlet } from "react-router-dom";
import Header from "./header.jsx";
import Footer from "./footer.jsx";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
