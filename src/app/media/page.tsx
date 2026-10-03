import type { Metadata } from "next";
import { MaritimeContent } from "@/components/montfort/divisions/content/Maritime";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = { title: "Calder Media" };

export default function MediaPage() {
  return (
    <DivisionShell page="Maritime">
      <MaritimeContent />
    </DivisionShell>
  );
}
