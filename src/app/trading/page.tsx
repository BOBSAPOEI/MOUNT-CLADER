import type { Metadata } from "next";
import { TradingContent } from "@/components/montfort/divisions/content/Trading";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = { title: "Montfort Trading" };

export default function TradingPage() {
  return (
    <DivisionShell page="Trading" active={1}>
      <TradingContent />
    </DivisionShell>
  );
}
