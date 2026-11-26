import type { Metadata } from "next";
import { FortEnergyContent } from "@/components/montfort/divisions/content/FortEnergy";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = {
  title: "Calder Data",
  description: "Analytics, measurement and marketing technology: one source of truth for every channel and market.",
};

export default function DataPage() {
  return (
    <DivisionShell page="FortEnergy">
      <FortEnergyContent />
    </DivisionShell>
  );
}
