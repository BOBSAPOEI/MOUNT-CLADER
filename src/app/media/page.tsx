import type { Metadata } from "next";
import { MaritimeContent } from "@/components/montfort/divisions/content/Maritime";
import { DivisionShell } from "@/components/montfort/divisions/DivisionShell";

export const metadata: Metadata = {
  title: "Calder Media",
  description: "Independent media planning and buying, partnerships, PR and influence, with brand safety built in.",
};

export default function MediaPage() {
  return (
    <DivisionShell page="Maritime">
      <MaritimeContent />
    </DivisionShell>
  );
}
