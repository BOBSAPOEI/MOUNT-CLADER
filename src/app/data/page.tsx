import type { Metadata } from "next";
import { FortEnergyContent } from "@/components/montfort/divisions/content/FortEnergy";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = { title: "Calder Data" };

export default function DataPage() {
  return (
    <DivisionShell page="FortEnergy">
      <FortEnergyContent />
    </DivisionShell>
  );
}
