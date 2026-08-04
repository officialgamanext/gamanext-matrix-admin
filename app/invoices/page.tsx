"use client";

import AdminLayout from "../components/AdminLayout";
import ComingSoonPage from "../components/ComingSoonPage";
import { Receipt } from "lucide-react";

export default function InvoicesPage() {
  return (
    <AdminLayout>
      <ComingSoonPage
        title="Invoices"
        description="Track billing, overdue balances, payment statuses, and automated reminders."
        icon={Receipt}
        itemType="Invoice"
        stats={[
          {
            label: "Average Sell-Through Rate",
            value: "94.2%",
            subtext: "2.4% above benchmark",
          },
          {
            label: "Total Outstanding Volume",
            value: "$18,450.00",
            subtext: "14 invoices pending",
          },
          {
            label: "Paid Invoices (This Month)",
            value: "$124,400.00",
            subtext: "112 completed payments",
          },
        ]}
        features={[
          {
            title: "PDF Invoice Builder",
            description: "Custom template designer with logo, tax IDs, and terms.",
            status: "In Progress",
          },
          {
            title: "Online Payment Integration",
            description: "Accept credit cards, Stripe, PayPal, and bank transfers.",
            status: "Testing",
          },
          {
            title: "Automated Overdue Reminders",
            description: "Scheduled email & SMS notifications for outstanding invoices.",
            status: "Planned",
          },
          {
            title: "Recurring Billing Schedules",
            description: "Automate monthly, quarterly, or yearly subscription billing.",
            status: "Planned",
          },
        ]}
      />
    </AdminLayout>
  );
}
