
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
import { ClipboardList } from "lucide-react";
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

export default function SelectMarketForResultsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Manage Results</h1>
        <p className="text-muted-foreground">Select a market to add or view results.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((market) => (
          <Card key={market.slug}>
            <CardHeader>
              <CardTitle>{market.name}</CardTitle>
            </CardHeader>
            <CardFooter>
               <Button asChild className="w-full">
                <Link href={`/admin/manage-results/${market.slug}`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Manage Results
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
