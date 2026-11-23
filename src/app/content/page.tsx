import type { Metadata } from "next";
import { CapitalContent } from "@/components/montfort/divisions/content/Capital";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = {
  title: "Calder Content",
  description: "The creative studio of Calder Group: brand ideas, films, social series and design made to be noticed.",
};

export default function ContentPage() {
  return (
    <DivisionShell page="Capital">
      <CapitalContent />
    </DivisionShell>
  );
}
