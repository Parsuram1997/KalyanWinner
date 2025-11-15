"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, GanttChartSquare, DollarSign } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const stats = [
  { name: "Total Users Enrolled", value: "150", icon: Users },
  { name: "Total Earnings", value: "₹12,500", icon: DollarSign },
  { name: "Total User Deposits", value: "₹2,50,000", icon: Wallet },
  { name: "Today's Enrollments", value: "5", icon: Users },
];

const recentEnrolledUsers = [
    { id: "USR150", name: "Suresh Kumar", mobile: "9876543321" },
    { id: "USR149", name: "Deepika Singh", mobile: "9876543320" },
    { id: "USR148", name: "Rohan Mehra", mobile: "9876543319" },
    { id: "USR147", name: "Anjali Verma", mobile: "9876543318" },
    { id: "USR146", name: "Vikram Rathod", mobile: "9876543317" },
]

export default function EnrollerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button asChild size="lg">
                    <Link href="/enroller/create-user">
                        <Users className="mr-2 h-5 w-5" />
                        Enroll New User
                    </Link>
                </Button>
                 <Button asChild variant="outline" size="lg">
                    <Link href="/enroller/users">
                        <GanttChartSquare className="mr-2 h-5 w-5" />
                        View All Enrolled Users
                    </Link>
                </Button>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Recently Enrolled Users</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentEnrolledUsers.map(user => (
                        <div key={user.id} className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.mobile}</p>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/admin/users/${user.id}`}>View</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
