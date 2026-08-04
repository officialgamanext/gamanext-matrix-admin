"use client";

import AdminLayout from "./components/AdminLayout";
import ComingSoonPage from "./components/ComingSoonPage";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <AdminLayout>
      <ComingSoonPage
        title="Dashboard"
        description="Real-time business performance overview, analytics, and revenue metrics."
        icon={LayoutDashboard}
        itemType="Widget"
        stats={[
          {
            label: "Total Monthly Revenue",
            value: "$142,850.00",
            subtext: "+14.2% from last month",
          },
          {
            label: "Active Customers",
            value: "1,248",
            subtext: "98.4% retention rate",
          },
          {
            label: "Pending Quotations",
            value: "32 Leads",
            subtext: "$48,200 estimated pipeline",
          },
        ]}
        features={[
          {
            title: "Live KPI Analytics Cards",
            description: "Real-time stream of sales, expenses, and growth indicators.",
            status: "In Progress",
          },
          {
            title: "Custom Executive Dashboards",
            description: "Drag-and-drop widget layout with exportable PDF reports.",
            status: "Planned",
          },
          {
            title: "Role-Based Data Filters",
            description: "Filter views by branch, region, or employee group.",
            status: "Testing",
          },
          {
            title: "Automated Insights & Alerts",
            description: "AI-driven anomaly detection for overdue invoices and high leads.",
            status: "Planned",
          },
        ]}
      />
    </AdminLayout>
  );
}
