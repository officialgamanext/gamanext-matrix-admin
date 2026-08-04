"use client";

import AdminLayout from "../components/AdminLayout";
import ComingSoonPage from "../components/ComingSoonPage";
import { Users } from "lucide-react";

export default function CustomersPage() {
  return (
    <AdminLayout>
      <ComingSoonPage
        title="Customers"
        description="Manage customer profiles, purchase histories, communication logs, and accounts."
        icon={Users}
        itemType="Customer"
        stats={[
          {
            label: "Total Customer Accounts",
            value: "1,248",
            subtext: "+34 new this week",
          },
          {
            label: "Average Customer Lifetime Value",
            value: "$3,450.00",
            subtext: "+5.1% YoY increase",
          },
          {
            label: "Active Subscriptions",
            value: "892 Clients",
            subtext: "12 pending renewal",
          },
        ]}
        features={[
          {
            title: "Client Profile & History",
            description: "360-degree timeline of client invoices, quotes, and emails.",
            status: "In Progress",
          },
          {
            title: "Automated Tagging & Segments",
            description: "Categorize clients by spend level, location, or industry.",
            status: "Planned",
          },
          {
            title: "Bulk CSV Import/Export",
            description: "Seamlessly import client lists from standard CRM platforms.",
            status: "Testing",
          },
          {
            title: "Client Portal Access",
            description: "Allow clients to log in, view quotes, and pay invoices directly.",
            status: "Planned",
          },
        ]}
      />
    </AdminLayout>
  );
}
