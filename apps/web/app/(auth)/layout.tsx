"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "../AuthProvider";

export default function ({ children }: { children: React.ReactNode }) {
  const { userProfile } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (userProfile === null) {
      router.push("/login");
    }
  }, [userProfile, router]);

  return children;
}
