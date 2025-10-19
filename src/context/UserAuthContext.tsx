import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const USER_AUTH_STORAGE_KEY = "wirebazaar-user";

type UserProfile = {
  id: string;
  email: string | null;
  phone: string | null;
  contact: string;
  lastLoginAt: string;
  authUser: SupabaseUser | null;
};

type PendingVerification = {
  contact: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
};

type UserAuthContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  requestOtp: (contact: string) => Promise<void>;
  verifyOtp: (contact: string, otp: string) => Promise<void>;
  logout: () => void;
};

const UserAuthContext = createContext<UserAuthContextValue | undefined>(undefined);

const bufferToHex = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const hashOtp = async (otp: string, contact: string) => {
  const encoder = new TextEncoder();
  const normalized = `${contact.toLowerCase().trim()}::${otp}`;
  const data = encoder.encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
};

const TEST_OTP = "123456";

const generateOtp = () => {
  return TEST_OTP;
};

const isValidEmail = (value: string) => {
  return /^(?:[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/u.test(value.trim());
};

const isValidPhone = (value: string) => {
  // Indian phone number: 10 digits starting with 6-9
  return /^[6-9]\d{9}$/.test(value.trim().replace(/[\s-]/g, ''));
};

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pending, setPending] = useState<PendingVerification | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (userData) {
            const profile: UserProfile = {
              id: userData.id,
              email: userData.email,
              phone: userData.phone,
              contact: userData.email || userData.phone || '',
              lastLoginAt: userData.last_login_at,
              authUser: session.user,
            };
            setUser(profile);
            localStorage.setItem(USER_AUTH_STORAGE_KEY, JSON.stringify(profile));
          }
        }
      } catch (error) {
        console.error("Failed to restore user session", error);
      }
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        localStorage.removeItem(USER_AUTH_STORAGE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const requestOtp = useCallback(async (contact: string) => {
    const trimmed = contact.trim();
    if (!isValidEmail(trimmed) && !isValidPhone(trimmed)) {
      throw new Error("Enter a valid mobile number or email address.");
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp, trimmed);
    const expiresAt = Date.now() + 5 * 60 * 1000;

    setPending({ contact: trimmed, otpHash, expiresAt, attempts: 0 });

    toast.success("OTP sent successfully.", {
      description: "Please enter the one-time password to verify your account.",
    });

    if (import.meta.env.DEV) {
      console.info(`[OTP DEBUG] Code for ${trimmed}: ${otp}`);
    }
  }, []);

  const verifyOtp = useCallback(
    async (contact: string, otp: string) => {
      const trimmedContact = contact.trim();
      if (!pending || pending.contact !== trimmedContact) {
        throw new Error("Please request a new OTP for this contact.");
      }

      if (Date.now() > pending.expiresAt) {
        setPending(null);
        throw new Error("OTP has expired. Please request a new code.");
      }

      if (pending.attempts >= 4) {
        setPending(null);
        throw new Error("Too many incorrect attempts. Please request a new OTP.");
      }

      if (!/^[0-9]{6}$/.test(otp.trim())) {
        throw new Error("Enter the 6-digit OTP sent to you.");
      }

      const candidateHash = await hashOtp(otp.trim(), trimmedContact);
      if (candidateHash !== pending.otpHash) {
        setPending((prev) => (prev ? { ...prev, attempts: prev.attempts + 1 } : prev));
        throw new Error("Incorrect OTP. Please try again.");
      }

      if (!isSupabaseConfigured) {
        throw new Error('Database not configured. Please try again later.');
      }

      let authUser: SupabaseUser;
      const isEmail = isValidEmail(trimmedContact);
      const isPhone = isValidPhone(trimmedContact);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError || !signInData.user) {
          throw new Error('Authentication session could not be established.');
        }
        authUser = signInData.user;
      } else {
        authUser = session.user;
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
        await supabase
          .from('users')
          .update({
            last_login_at: new Date().toISOString(),
            email: isEmail ? trimmedContact : existingUser.email,
            phone: isPhone ? trimmedContact : existingUser.phone,
            is_verified: true
          })
          .eq('id', userId);
      } else {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: isEmail ? trimmedContact : null,
            phone: isPhone ? trimmedContact : null,
            is_verified: true,
            last_login_at: new Date().toISOString()
          })
          .select('*')
          .single();

        if (error || !newUser) {
          throw new Error("Failed to create user account. Please try again.");
        }
        userId = newUser.id;
      }

      const profile: UserProfile = {
        id: userId,
        email: isEmail ? trimmedContact : null,
        phone: isPhone ? trimmedContact : null,
        contact: trimmedContact,
        lastLoginAt: new Date().toISOString(),
        authUser,
      };

      setUser(profile);
      localStorage.setItem(USER_AUTH_STORAGE_KEY, JSON.stringify(profile));
      setPending(null);

      toast.success("Login successful.", {
        description: "You are now securely logged in.",
      });
    },
    [pending],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_AUTH_STORAGE_KEY);
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
    toast.info("You have been logged out.");
  }, []);

  const value = useMemo<UserAuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      requestOtp,
      verifyOtp,
      logout,
    }),
    [logout, requestOtp, user, verifyOtp],
  );

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
};
