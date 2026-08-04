"use client";

import AdminLayout from "../components/AdminLayout";
import ComingSoonPage from "../components/ComingSoonPage";
import { Target } from "lucide-react";

export default function LeadsPage() {
  return (
    <AdminLayout>
      <ComingSoonPage
        title="Leads"
        description="Track prospective clients, lead scoring, deal stages, and conversion funnels."
        icon={Target}
        itemType="Lead"
        stats={[
          {
            label: "Active Sales Pipeline",
            value: "$94,200.00",
            subtext: "28 active opportunities",
          },
          {
            label: "Conversion Rate",
            value: "38.5%",
            subtext: "+4.2% above last month",
          },
          {
            label: "New Leads This Week",
            value: "14 Prospects",
            subtext: "9 assigned to sales reps",
          },
        ]}
        features={[
          {
            title: "Kanban Deal Pipeline",
            description: "Drag-and-drop lead stages (New, Qualified, Proposal, Won, Lost).",
            status: "In Progress",
          },
          {
            title: "Lead Capture Form Integrations",
            description: "Automatically sync web forms and landing page inquiries.",
            status: "Testing",
          },
          {
            title: "Activity & Call Logs",
            description: "Log phone calls, emails, meetings, and follow-up reminders.",
            status: "Planned",
          },
          {
            title: "AI Lead Scoring",
            description: "Predictive deal closure probability based on customer behavior.",
            status: "Planned",
          },
        ]}
      />
    </AdminLayout>
  );
}
