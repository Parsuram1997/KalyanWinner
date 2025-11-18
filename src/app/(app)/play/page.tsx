
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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


export default function MarketSelectionPage() {
    const firestore = useFirestore();
    const activeMarketsQuery = useMemoFirebase(
        () =>
        firestore
            ? query(collection(firestore, "markets"), where("status", "==", "Active"))
            : null,
        [firestore]
    );
    const { data: markets, isLoading } = useCollection<any>(activeMarketsQuery);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Choose a Market</h1>
        <p className="text-muted-foreground">Select a market you want to play in.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="p-4 pb-2">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="p-4 pt-2 pb-2">
                   <Skeleton className="h-3 w-full" />
                </CardContent>
                <CardFooter className="p-4 pt-2">
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))
          : markets?.map((market) => (
          <Card key={market.id} className="flex flex-col justify-between">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{market.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>Open: <span className="font-semibold text-primary">{market.openTime}</span></span>
                    <span> | </span>
                    <span>Close: <span className="font-semibold text-destructive">{market.closeTime}</span></span>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-2">
               <Button asChild className="w-full" size="sm">
                <Link href={`/play/${market.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Play Now
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       {!isLoading && markets?.length === 0 && (
        <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
                No active markets found.
            </CardContent>
        </Card>
      )}
    </div>
  );
}
