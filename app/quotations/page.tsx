"use client";

import AdminLayout from "../components/AdminLayout";
import ComingSoonPage from "../components/ComingSoonPage";
import { FileText } from "lucide-react";

export default function QuotationsPage() {
  return (
    <AdminLayout>
      <ComingSoonPage
        title="Quotations"
        description="Generate, send, and track formal client estimates and price quotes."
        icon={FileText}
        itemType="Quotation"
        stats={[
          {
            label: "Open Estimates",
            value: "18 Quotes",
            subtext: "$62,500 total value",
          },
          {
            label: "Quote Approval Rate",
            value: "72.4%",
            subtext: "Avg. 3 days turnaround",
          },
          {
            label: "Converted to Invoice",
            value: "14 Quotes",
            subtext: "This month",
          },
        ]}
        features={[
          {
            title: "Quick Quote Generator",
            description: "Build itemized proposals with line-item discounts and taxes.",
            status: "In Progress",
          },
          {
            title: "One-Click Invoice Conversion",
            description: "Convert approved quotes directly into finalized invoices.",
            status: "Testing",
          },
          {
            title: "Client E-Signature Support",
            description: "Allow clients to accept and sign quotes electronically.",
            status: "Planned",
          },
          {
            title: "Version History & Revision Logs",
            description: "Track edits, client feedback, and quote versioning history.",
            status: "Planned",
          },
        ]}
      />
    </AdminLayout>
  );
}
