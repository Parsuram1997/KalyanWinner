"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Wallet } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const recentActivity = [
  { id: 1, description: "Bet on Jodi 45", market: "Kalyan Night", status: "Pending", date: "2024-07-20", amount: "-₹100.00", type: "debit" },
  { id: 2, description: "Wallet Deposit", market: "via UPI", status: "Completed", date: "2024-07-19", amount: "+₹500.00", type: "credit" },
  { id: 3, description: "Win on Single 8", market: "Kalyan Day", status: "Won", date: "2024-07-18", amount: "+₹950.00", type: "credit" },
  { id: 4, description: "Bet on Open Panna 123", market: "Kalyan Day", status: "Lost", date: "2024-07-18", amount: "-₹50.00", type: "debit" },
  { id: 5, description: "Withdrawal", market: "to Bank Account", status: "Completed", date: "2024-07-17", amount: "-₹1000.00", type: "debit" },
  { id: 6, description: "Bet on Jodi 78", market: "Kalyan Night", status: "Pending", date: "2024-07-17", amount: "-₹200.00", type: "debit" },
  { id: 7, description: "Win on Close Panna 456", market: "Kalyan Day", status: "Won", date: "2024-07-16", amount: "+₹1400.00", type: "credit" },
  { id: 8, description: "Wallet Deposit", market: "via Card", status: "Completed", date: "2024-07-16", amount: "+₹2000.00", type: "credit" },
  { id: 9, description: "Bet on Single 2", market: "Kalyan Night", status: "Lost", date: "2024-07-15", amount: "-₹150.00", type: "debit" },
  { id: 10, description: "Win on Jodi 99", market: "Kalyan Day", status: "Won", date: "2024-07-15", amount: "+₹4750.00", type: "credit" },
  { id: 11, description: "Bet on Jodi 99", market: "Kalyan Day", status: "Placed", date: "2024-07-15", amount: "-₹50.00", type: "debit" },
  { id: 12, description: "Wallet Deposit", market: "via Netbanking", status: "Completed", date: "2024-07-14", amount: "+₹300.00", type: "credit" },
  { id: 13, description: "Bet on Close Panna 789", market: "Kalyan Night", status: "Pending", date: "2024-07-14", amount: "-₹10.00", type: "debit" },
  { id: 14, description: "Win on Open Single 1", market: "Kalyan Day", status: "Won", date: "2024-07-13", amount: "+₹95.00", type: "credit" },
  { id: 15, description: "Bet on Jodi 13", market: "Kalyan Day", status: "Placed", date: "2024-07-13", amount: "-₹10.00", type: "debit" },
];

const displayedActivity = recentActivity.slice(0, 15);

const latestResults = [
  {
    market: "Kalyan Day",
    date: "20/07/2024",
    openPanna: "128",
    jodi: "13",
    closePanna: "490",
  },
  {
    market: "Kalyan Night",
    date: "19/07/2024",
    openPanna: "345",
    jodi: "21",
    closePanna: "678",
  },
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,245.50</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm" asChild>
              <Link href="/wallet">
                <Wallet className="mr-1.5 h-4 w-4" /> Manage Funds
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Latest Result</CardTitle>
            <CardDescription>Toggle between Day and Night results.</CardDescription>
          </CardHeader>
          <Carousel className="w-full h-full flex flex-col">
            <CarouselContent>
              {latestResults.map((result, index) => (
                <CarouselItem key={index} className="h-full">
                  <CardContent className="p-6 pt-0 flex items-center justify-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">Open</span>
                        <span className="text-2xl font-bold tracking-widest">{result.openPanna}</span>
                      </div>
                      <div className="flex flex-col items-center rounded-md bg-primary px-3 py-1 text-primary-foreground">
                        <span className="text-3xl font-bold tracking-wider">{result.jodi}</span>
                        <span className="text-[10px] font-medium">{result.market}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">Close</span>
                        <span className="text-2xl font-bold tracking-widest">{result.closePanna}</span>
                      </div>
                    </div>
                  </CardContent>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <CardFooter className="mt-auto">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/results">View All Results</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="font-medium">{activity.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.market}
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge 
                        variant={
                          activity.status === "Won" ? "default" :
                          activity.status === "Completed" ? "secondary" :
                          "outline"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.date}</TableCell>
                    <TableCell className={`text-right ${activity.type === 'credit' ? 'text-green-600' : ''}`}>
                      {activity.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-4 md:hidden">
            {displayedActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{activity.description}</div>
                  <div className="text-sm text-muted-foreground">{activity.market} - {activity.date}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${activity.type === 'credit' ? 'text-green-600' : ''}`}>{activity.amount}</div>
                   <Badge 
                    variant={
                      activity.status === "Won" ? "default" :
                      activity.status === "Completed" ? "secondary" :
                      "outline"
                    }
                  >
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    