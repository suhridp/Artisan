// src/App.jsx
import { Route, Routes } from "react-router-dom";
import Layout from "./layout.jsx";
import { UserContextProvider } from "./UserContext.jsx";

// Pages
import IndexPage from "./pages/indexpage.jsx";
import LoginPage from "./pages/loginpage.jsx";
import RegisterPage from "./pages/registerpage.jsx";
import AccountPage from "./pages/account.jsx";
import ProductsPage from "./pages/productspage.jsx";
import ProductsFormPage from "./pages/productsformpage.jsx";
import ProductPage from "./pages/productpage.jsx";
import OrdersPage from "./pages/orderspage.jsx";
import CartPage from "./pages/cart.jsx";
import ProductEdit from "./productedit.jsx";

// inside <Routes> under Layout

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="mb-2 text-3xl font-semibold">Page Not Found</h1>
      <p className="text-neutral-600">
        Sorry, we couldn’t find what you’re looking for.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public */}
          <Route index element={<IndexPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="products/:id" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />;{/* Account area */}
          <Route path="account" element={<AccountPage />}>
            <Route
              path="/account/products/:id/photos"
              element={<ProductEdit />}
            />
            <Route index element={<div />} /> {/* Profile is in AccountPage */}
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductsFormPage />} />
            <Route path="products/:id" element={<ProductsFormPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrdersPage />} />
          </Route>
          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </UserContextProvider>
  );
}
