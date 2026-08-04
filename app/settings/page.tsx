"use client";

import AdminLayout from "../components/AdminLayout";
import ComingSoonPage from "../components/ComingSoonPage";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AdminLayout>
      <ComingSoonPage
        title="Settings"
        description="Configure organization profiles, brand colors, notifications, integrations, and security."
        icon={Settings}
        itemType="Setting"
        stats={[
          {
            label: "System Status",
            value: "100% Operational",
            subtext: "All services healthy",
          },
          {
            label: "Active Integrations",
            value: "6 Services",
            subtext: "API, Storage, Mail",
          },
          {
            label: "Security Score",
            value: "98 / 100",
            subtext: "2FA Enabled for all admins",
          },
        ]}
        features={[
          {
            title: "Brand Theme & Custom Colors",
            description: "Customize header colors, logo assets, and admin portal styling.",
            status: "In Progress",
          },
          {
            title: "Organization & Multi-Branch",
            description: "Manage company profiles, tax identification numbers, and addresses.",
            status: "Testing",
          },
          {
            title: "API Keys & Webhooks",
            description: "Developer settings for third-party integrations and webhooks.",
            status: "Planned",
          },
          {
            title: "Audit & Security Logs",
            description: "Real-time user activity logs, login history, and security alerts.",
            status: "Planned",
          },
        ]}
      />
    </AdminLayout>
  );
}
