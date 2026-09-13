"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/client";
import { UserProfile } from "@/lib/types";

const AuthContext = createContext<{ userProfile: UserProfile | null, setUserProfile: (userProfile: UserProfile | null) => void }>({ userProfile: null, setUserProfile: () => undefined });

export function useUserProfile() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from("users").select("id, role, username, display_name").eq("id", user.id).single()
        .then(({ data }) => setUserProfile(data && { ...data, email: user.email }));
    } else {
      setUserProfile(null);
    }
  }, [user]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile }} >
      {children}
    </AuthContext.Provider>
  );
}
