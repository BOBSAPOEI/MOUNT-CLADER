import type { Metadata } from "next";
import { TradingContent } from "@/components/montfort/divisions/content/Trading";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = {
  title: "Calder Digital",
  description: "Performance marketing that compounds: search, social, programmatic, marketplaces, e-commerce, CRM and the websites they lead to.",
};

export default function DigitalPage() {
  return (
    <DivisionShell page="Trading">
      <TradingContent />
    </DivisionShell>
  );
}
