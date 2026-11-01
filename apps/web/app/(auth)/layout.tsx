"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserProfile } from "../AuthProvider";

export default function ({ children }: { children: React.ReactNode }) {
  const { userProfile } = useUserProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (userProfile === null && pathname !== "/login") {
      const timeout = setTimeout(() => router.replace(`/login?redirect=${pathname}`), 300);
      return () => clearTimeout(timeout);
    }
  }, [userProfile, pathname, router]);

  return children;
}
