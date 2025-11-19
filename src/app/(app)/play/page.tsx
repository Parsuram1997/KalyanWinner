
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
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

type Market = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
};

type Result = {
  id: string;
  date: string;
  marketName: string;
  openPanna: string;
  jodi: string;
  closePanna: string;
};

const getPannaSum = (panna: string) => {
    if (!panna || panna.length !== 3 || !/^\d+$/.test(panna)) return '-';
    return panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
};


const MarketResult = ({ marketName }: { marketName: string }) => {
    const firestore = useFirestore();

    const resultQuery = useMemoFirebase(
        () => firestore ? query(
            collection(firestore, "kalyan_results"),
            where("marketName", "==", marketName),
            orderBy("date", "desc"),
            limit(1)
        ) : null,
        [firestore, marketName]
    );

    const { data: results, isLoading } = useCollection<Result>(resultQuery, { skip: !firestore });
    const result = results?.[0];

    if (isLoading) {
        return <Skeleton className="h-5 w-full" />;
    }

    if (!result || result.jodi === 'L') {
        return null; // Don't show anything if no result or it's a holiday
    }

    const isOpenResult = result.openPanna && !result.closePanna;
    const isFullResult = result.openPanna && result.closePanna;

    return (
        <div className="mt-2 text-center font-mono text-sm">
            {isFullResult && (
                 <div className="flex items-center justify-center gap-2">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold tracking-widest">{result.openPanna}</span>
                    </div>
                    <div className="flex flex-col items-center rounded-md bg-primary px-3 py-1 text-primary-foreground">
                        <span className="text-3xl font-bold tracking-wider">{result.jodi}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold tracking-widest">{result.closePanna}</span>
                    </div>
                </div>
            )}
            {isOpenResult && (
                 <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <span className="text-2xl font-bold tracking-widest text-foreground">{result.openPanna}</span>
                    <span className="text-2xl font-bold"> - </span>
                    <span className="text-3xl font-bold text-primary">{getPannaSum(result.openPanna)}</span>
                    <span className="text-3xl font-bold text-muted-foreground animate-pulse"> - </span>
                </div>
            )}
        </div>
    );
}


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
                   <Skeleton className="h-8 w-full mt-2" />
                </CardContent>
                <CardFooter className="p-4 pt-2">
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))
          : markets?.map((market) => (
          <Card key={market.id} className="flex flex-col justify-between">
            <div>
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
                    <MarketResult marketName={market.name} />
                </CardContent>
            </div>
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
