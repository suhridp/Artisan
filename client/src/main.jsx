// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import QueryProvider from "./providers/QueryProvider.jsx";
import { CartProvider } from "./context/CartContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <QueryProvider>
          {/* or remove if not used */}
          <App />
        </QueryProvider>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
