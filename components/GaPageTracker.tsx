"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  initializeGa,
  type GaItem,
  trackPageView,
  trackPurchase,
} from "@/lib/ga";

type PurchaseTrackingDetail = {
  currency: string;
  value: number;
  items: GaItem[];
  orderId?: string;
};

export default function GaPageTracker() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSearch(window.location.search || "");
  }, [pathname]);

  const currentPath = useMemo(() => {
    return search ? `${pathname}${search}` : pathname;
  }, [pathname, search]);

  useEffect(() => {
    initializeGa();
  }, []);

  useEffect(() => {
    if (!currentPath) return;
    initializeGa();
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
