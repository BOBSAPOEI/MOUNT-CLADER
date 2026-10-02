import type { Metadata } from "next";
import { FortEnergyContent } from "@/components/montfort/divisions/content/FortEnergy";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = { title: "Fort Energy" };

export default function FortEnergyPage() {
  return (
    <DivisionShell page="FortEnergy">
      <FortEnergyContent />
    </DivisionShell>
  );
}
