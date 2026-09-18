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
      router.push(`/login?redirect=${pathname}`);
    }
  }, [userProfile, pathname, router]);

  return children;
}
