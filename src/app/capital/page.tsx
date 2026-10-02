import type { Metadata } from "next";
import { CapitalContent } from "@/components/montfort/divisions/content/Capital";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = { title: "Montfort Capital" };

export default function CapitalPage() {
  return (
    <DivisionShell page="Capital" active={2}>
      <CapitalContent />
    </DivisionShell>
  );
}
