import type { Metadata } from "next";
import { TradingContent } from "@/components/montfort/divisions/content/Trading";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = { title: "Calder Digital" };

export default function DigitalPage() {
  return (
    <DivisionShell page="Trading">
      <TradingContent />
    </DivisionShell>
  );
}
