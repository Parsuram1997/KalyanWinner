"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, Wallet, GanttChartSquare } from "lucide-react";

const stats = [
  { name: "Total Users", value: "1,250", icon: Users },
  { name: "Total Bets Placed", value: "8,420", icon: GanttChartSquare },
  { name: "Total Winnings", value: "₹5,40,500", icon: ClipboardList },
  { name: "Pending Withdrawals", value: "12", icon: Wallet },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Add more sections like recent activity, charts, etc. */}
    </div>
  );
}
