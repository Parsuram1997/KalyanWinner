
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock } from "lucide-react";

const markets = [
  { name: "Kalyan Day", open: "04:30 PM", close: "06:30 PM" },
  { name: "Kalyan Night", open: "09:30 PM", close: "11:30 PM" },
  { name: "Time Bazar", open: "01:00 PM", close: "02:00 PM" },
  { name: "Madhur Day", open: "01:30 PM", close: "02:30 PM" },
  { name: "Madhur Night", open: "08:30 PM", close: "10:30 PM" },
  { name: "Milan Day", open: "03:15 PM", close: "05:15 PM" },
  { name: "Milan Night", open: "09:15 PM", close: "11:15 PM" },
  { name: "Rajdhani Day", open: "04:55 PM", close: "06:55 PM" },
  { name: "Rajdhani Night", open: "09:25 PM", close: "11:35 PM" },
  { name: "Main Bazar", open: "09:40 PM", close: "11:55 PM" },
  { name: "Sridevi Day", open: "11:35 AM", close: "12:35 PM" },
  { name: "Sridevi Night", open: "07:00 PM", close: "08:00 PM" },
  { name: "Supreme Day", open: "03:35 PM", close: "05:35 PM" },
  { name: "Supreme Night", open: "08:45 PM", close: "10:45 PM" },
  { name: "Tara Mumbai Day", open: "01:35 PM", close: "02:35 PM" },
  { name: "Tara Mumbai Night", open: "10:00 PM", close: "12:00 AM" },
  { name: "Ratan Morning", open: "10:00 AM", close: "11:00 AM" },
  { name: "Ratan Day", open: "03:00 PM", close: "05:00 PM" },
  { name: "Ratan Night", open: "09:10 PM", close: "11:10 PM" },
  { name: "Main Ratan", open: "09:00 PM", close: "11:00 PM" },
];

export default function GameTimingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Game Timings</h1>
        <p className="text-muted-foreground">
          A schedule of open and close times for all markets.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            <span>Market Schedule</span>
          </CardTitle>
          <CardDescription>
            All timings are in Indian Standard Time (IST).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">Market Name</TableHead>
                  <TableHead className="text-center text-base">Open Time</TableHead>
                  <TableHead className="text-center text-base">Close Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markets.map((market) => (
                  <TableRow key={market.name}>
                    <TableCell className="font-medium text-base">{market.name}</TableCell>
                    <TableCell className="text-center font-semibold text-primary text-base">
                      {market.open}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-destructive text-base">
                      {market.close}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
