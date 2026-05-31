"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/ga";

export default function GaPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPath = useMemo(() => {
    const search = searchParams?.toString() || "";
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!currentPath) return;
    trackPageView(currentPath);
  }, [currentPath]);

  return null;
}
