"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { type GaItem, trackPageView, trackPurchase } from "@/lib/ga";

type PurchaseTrackingDetail = {
  currency: string;
  value: number;
  items: GaItem[];
  orderId?: string;
};

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

  useEffect(() => {
    const handlePurchase = (event: Event) => {
      const customEvent = event as CustomEvent<PurchaseTrackingDetail>;
      const detail = customEvent.detail;
      if (!detail) return;
      if (!Array.isArray(detail.items) || detail.items.length === 0) return;
      if (!detail.currency || !Number.isFinite(detail.value)) return;
      trackPurchase(detail);
    };

    window.addEventListener("allinone:purchase", handlePurchase as EventListener);
    return () => {
      window.removeEventListener(
        "allinone:purchase",
        handlePurchase as EventListener
      );
    };
  }, []);

  return null;
}
