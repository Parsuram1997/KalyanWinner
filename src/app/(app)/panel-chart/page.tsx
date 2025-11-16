
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { GanttChartSquare } from "lucide-react";
import Link from "next/link";

const markets = [
  { name: "Kalyan Day", slug: "kalyan-day", description: "View the yearly panel chart for Kalyan Day." },
  { name: "Kalyan Night", slug: "kalyan-night", description: "View the yearly panel chart for Kalyan Night." },
];

export default function SelectChartPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Panel Charts</h1>
        <p className="text-muted-foreground">Select a market to view its yearly panel chart.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {markets.map((market) => (
          <Card key={market.slug} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{market.name}</CardTitle>
              <CardDescription>{market.description}</CardDescription>
            </CardHeader>
            <CardFooter>
               <Button asChild className="w-full">
                <Link href={`/panel-chart/${market.slug}`}>
                  <GanttChartSquare className="mr-2 h-4 w-4" />
                  View Chart
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
