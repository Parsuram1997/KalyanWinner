
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Ticket, Clock } from "lucide-react";
import Link from "next/link";

const markets = [
  { name: "Kalyan Day", slug: "kalyan-day", open: "04:30 PM", close: "06:30 PM" },
  { name: "Kalyan Night", slug: "kalyan-night", open: "09:30 PM", close: "11:30 PM" },
  { name: "Time Bazar", slug: "time-bazar", open: "01:00 PM", close: "02:00 PM" },
  { name: "Madhur Day", slug: "madhur-day", open: "01:30 PM", close: "02:30 PM" },
  { name: "Madhur Night", slug: "madhur-night", open: "08:30 PM", close: "10:30 PM" },
  { name: "Milan Day", slug: "milan-day", open: "03:15 PM", close: "05:15 PM" },
  { name: "Milan Night", slug: "milan-night", open: "09:15 PM", close: "11:15 PM" },
  { name: "Rajdhani Day", slug: "rajdhani-day", open: "04:55 PM", close: "06:55 PM" },
  { name: "Rajdhani Night", slug: "rajdhani-night", open: "09:25 PM", close: "11:35 PM" },
  { name: "Main Bazar", slug: "main-bazar", open: "09:40 PM", close: "11:55 PM" },
  { name: "Sridevi Day", slug: "sridevi-day", open: "11:35 AM", close: "12:35 PM" },
  { name: "Sridevi Night", slug: "sridevi-night", open: "07:00 PM", close: "08:00 PM" },
  { name: "Supreme Day", slug: "supreme-day", open: "03:35 PM", close: "05:35 PM" },
  { name: "Supreme Night", slug: "supreme-night", open: "08:45 PM", close: "10:45 PM" },
  { name: "Tara Mumbai Day", slug: "tara-mumbai-day", open: "01:35 PM", close: "02:35 PM" },
  { name: "Tara Mumbai Night", slug: "tara-mumbai-night", open: "10:00 PM", close: "12:00 AM" },
  { name: "Ratan Morning", slug: "ratan-morning", open: "10:00 AM", close: "11:00 AM" },
  { name: "Ratan Day", slug: "ratan-day", open: "03:00 PM", close: "05:00 PM" },
  { name: "Ratan Night", slug: "ratan-night", open: "09:10 PM", close: "11:10 PM" },
  { name: "Main Ratan", slug: "main-ratan", open: "09:00 PM", close: "11:00 PM" },
];

export default function MarketSelectionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Choose a Market</h1>
        <p className="text-muted-foreground">Select a market you want to play in.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {markets.map((market) => (
          <Card key={market.slug} className="flex flex-col justify-between">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{market.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>Open: <span className="font-semibold text-primary">{market.open}</span></span>
                    <span> | </span>
                    <span>Close: <span className="font-semibold text-destructive">{market.close}</span></span>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-2">
               <Button asChild className="w-full" size="sm">
                <Link href={`/play/${market.slug}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Play Now
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
