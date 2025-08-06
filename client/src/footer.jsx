// src/footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Quick Links
            </h5>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>
                <Link to="/" className="hover:text-neutral-900">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/account/products" className="hover:text-neutral-900">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-neutral-900">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="hover:text-neutral-900">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Info
            </h5>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>
                <Link to="/about" className="hover:text-neutral-900">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-neutral-900">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-neutral-900">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Connect
            </h5>
            <p className="mt-3 max-w-xs text-sm text-neutral-700">
              Follow us on social media for the latest updates and promotions.
            </p>
            {/* Optional: add subtle, minimal social icons */}
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Artisan. All rights reserved.
      </div>
    </footer>
  );
}
