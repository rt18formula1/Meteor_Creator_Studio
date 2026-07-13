"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanTier } from "@/lib/types";

type SubscriptionState = {
  tier: PlanTier;
  setTier: (tier: PlanTier) => void;
};

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set) => ({
      tier: "free",
      setTier: (tier) => set({ tier }),
    }),
    { name: "editional-subscription" },
  ),
);
