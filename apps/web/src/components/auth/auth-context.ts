"use client";

import { createContext, useContext } from "react";

export interface AuthState {
  configured: boolean;
  ready: boolean;
  authenticated: boolean;
  /** Back from X's authorize page, the sign-in is still being confirmed: show a wait state, not the button again. */
  pending: boolean;
  /** `xOnly` hides the wallet option (the waitlist needs an X account). */
  login: (opts?: { xOnly?: boolean }) => void;
  logout: () => Promise<void>;
  linkTwitter: () => void;
  getToken: () => Promise<string | null>;
}

export const noop = () => {
  console.warn("Privy is not configured: set NEXT_PUBLIC_PRIVY_APP_ID");
};

export const AuthContext = createContext<AuthState>({
  configured: false,
  ready: true,
  authenticated: false,
  pending: false,
  login: noop,
  logout: async () => {},
  linkTwitter: noop,
  getToken: async () => null,
});

export const useAuth = () => useContext(AuthContext);
