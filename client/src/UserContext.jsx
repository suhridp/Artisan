// src/UserContext.jsx
import { createContext, useEffect, useState } from "react";
import api from "./lib/api";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/profile");
        if (!active) return;
        setUser(data || null);
      } catch {
        if (!active) return;
        setUser(null);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
    // run once on mount – we purposely do NOT depend on `user`
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, ready }}>
      {children}
    </UserContext.Provider>
  );
}
