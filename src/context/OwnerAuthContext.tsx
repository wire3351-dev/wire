import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

const OWNER_AUTH_STORAGE_KEY = "owner-dashboard-authenticated";
const OWNER_EMAIL = "owner@cablehq.com";
const OWNER_PASSWORD = "SecurePass123!";

interface OwnerAuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const OwnerAuthContext = createContext<OwnerAuthContextValue | undefined>(undefined);

export const OwnerAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(OWNER_AUTH_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const checkSession = async () => {
      const stored = localStorage.getItem(OWNER_AUTH_STORAGE_KEY);
      if (stored === "true") {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAuthenticated(false);
          localStorage.removeItem(OWNER_AUTH_STORAGE_KEY);
        }
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (normalizedEmail !== OWNER_EMAIL || normalizedPassword !== OWNER_PASSWORD) {
      toast.error('Invalid credentials');
      return false;
    }

    if (isSupabaseConfigured) {
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          console.error('Admin auth failed:', signInError);
          toast.error('Authentication failed. Please try again.');
          return false;
        }

        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(OWNER_AUTH_STORAGE_KEY, "true");
        }
        toast.success('Welcome back!');
        return true;
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Login failed. Please try again.');
        return false;
      }
    } else {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(OWNER_AUTH_STORAGE_KEY, "true");
      }
      return true;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(OWNER_AUTH_STORAGE_KEY);
    }
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    toast.info('Logged out successfully');
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated, login, logout],
  );

  return <OwnerAuthContext.Provider value={value}>{children}</OwnerAuthContext.Provider>;
};

export const useOwnerAuth = () => {
  const context = useContext(OwnerAuthContext);

  if (!context) {
    throw new Error("useOwnerAuth must be used within an OwnerAuthProvider");
  }

  return context;
};
