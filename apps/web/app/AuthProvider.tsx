"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/client";
import { UserProfile } from "@/lib/types";

const AuthContext = createContext<{ userProfile: UserProfile | null | undefined, setUserProfile: (userProfile: UserProfile | null | undefined) => void }>({ userProfile: undefined, setUserProfile: () => undefined });

export function useUserProfile() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from("users").select("id, role, username, display_name").eq("id", user.id).single()
        .then(({ data }) => setUserProfile(data && { ...(data as UserProfile), email: user.email }));
    } else {
      setUserProfile(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile }} >
      {children}
    </AuthContext.Provider>
  );
}
