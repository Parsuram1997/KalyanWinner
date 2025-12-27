
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import { GanttChartSquare } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Market = {
  id: string;
  name: string;
};

export default function SelectChartPage() {
  const firestore = useFirestore();
  // CORRECTED: The field to check for active markets is `active` (boolean), not `status` (string).
  const activeMarketsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "markets"), where("active", "==", true))
        : null,
    [firestore]
  );
  const { data: markets, isLoading } = useCollection<Market>(activeMarketsQuery);
  
  // CORRECTED: Slug should be generated with hyphens for cleaner URLs.
  const generateSlug = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');


  return (
    <div className="flex flex-col gap-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Panel Charts</h1>
            <p className="text-muted-foreground">Select a market to view its yearly panel chart.</p>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-gradient-to-br from-blue-600 to-purple-700 border-0">
                <CardHeader className="p-4 pb-2">
                  <Skeleton className="h-5 w-3/4 bg-white/20" />
                   <Skeleton className="h-3 w-full mt-1 bg-white/20" />
                </CardHeader>
                <CardFooter className="p-4 pt-2">
                  <Skeleton className="h-8 w-full bg-white/20" />
                </CardFooter>
              </Card>
            ))
          : markets?.map((market) => (
          <Card key={market.id} className="flex flex-col justify-between bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{market.name}</CardTitle>
              <CardDescription className="text-xs text-white/80">View the yearly panel chart.</CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-2">
               <Button asChild className="w-full" size="sm">
                <Link href={`/panel-chart/${generateSlug(market.name)}`}>
                  <GanttChartSquare className="mr-2 h-4 w-4" />
                  View Chart
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {!isLoading && markets?.length === 0 && (
        <Card className="col-span-full bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
            <CardContent className="p-8 text-center text-white/80">
                No active markets found.
            </CardContent>
        </Card>
      )}
    </div>
  );
}
