import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "~/constant/_index";

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          setAuthState({
            user: null,
            loading: false,
            error: error.message,
          });
          return;
        }

        setAuthState({
          user: session?.user || null,
          loading: false,
          error: null,
        });
      } catch (err) {
        setAuthState({
          user: null,
          loading: false,
          error: "Failed to get session",
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthState({
        user: session?.user || null,
        loading: false,
        error: null,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthState((prev) => ({ ...prev, error: error.message }));
      }
    } catch (err) {
      setAuthState((prev) => ({ ...prev, error: "Failed to sign out" }));
    }
  };

  return {
    ...authState,
    signOut,
    isAuthenticated: !!authState.user,
  };
}
