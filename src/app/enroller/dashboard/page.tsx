
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowUpCircle } from "lucide-react";

const stats = [
  { name: "Total Enrolled Users", value: "52", icon: Users },
  { name: "Total Deposits from Your Users", value: "₹45,500", icon: ArrowUpCircle },
];

export default function EnrollerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Enroller Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your enrolled users and their activity.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
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
    </div>
  );
}
