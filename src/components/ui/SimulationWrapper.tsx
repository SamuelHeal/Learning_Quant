"use client";

import dynamic from "next/dynamic";

// Dynamically import the AlgoTradingSimulation with no SSR
// This is needed because it uses browser APIs and client-side effects
const AlgoTradingSimulation = dynamic(
  () => import("@/components/ui/AlgoTradingSimulation"),
  { ssr: false }
);

export default function SimulationWrapper() {
  return <AlgoTradingSimulation />;
}
