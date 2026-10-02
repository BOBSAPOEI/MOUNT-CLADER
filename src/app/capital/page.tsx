import type { Metadata } from "next";
import { CapitalContent } from "@/components/montfort/divisions/content/Capital";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = { title: "Calder Capital" };

export default function CapitalPage() {
  return (
    <DivisionShell page="Capital">
      <CapitalContent />
    </DivisionShell>
  );
}
