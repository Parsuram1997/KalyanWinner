
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Ticket } from "lucide-react";
import Link from "next/link";

const markets = [
  { name: "Kalyan Day", slug: "kalyan-day" },
  { name: "Kalyan Night", slug: "kalyan-night" },
  { name: "Time Bazar", slug: "time-bazar" },
  { name: "Madhur Day", slug: "madhur-day" },
  { name: "Madhur Night", slug: "madhur-night" },
  { name: "Milan Day", slug: "milan-day" },
  { name: "Milan Night", slug: "milan-night" },
  { name: "Rajdhani Day", slug: "rajdhani-day" },
  { name: "Rajdhani Night", slug: "rajdhani-night" },
  { name: "Main Bazar", slug: "main-bazar" },
];

export default function SelectMarketForBiddingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Manage Bidding</h1>
        <p className="text-muted-foreground">Select a market to view all bids.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((market) => (
          <Card key={market.slug}>
            <CardHeader>
              <CardTitle>{market.name}</CardTitle>
            </CardHeader>
            <CardFooter>
               <Button asChild className="w-full">
                <Link href={`/admin/manage-bidding/${market.slug}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  View Bids
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
