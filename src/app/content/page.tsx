import type { Metadata } from "next";
import { CapitalContent } from "@/components/montfort/divisions/content/Capital";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = { title: "Calder Content" };

export default function ContentPage() {
  return (
    <DivisionShell page="Capital">
      <CapitalContent />
    </DivisionShell>
  );
}
