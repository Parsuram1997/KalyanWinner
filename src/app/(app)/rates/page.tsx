
"use client";

import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { Coins, Tag, Store } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

type GameRate = {
  id: string;
  name: string;
  betAmount: number;
  payoutAmount: number;
};

type Market = {
    id: string;
    name: string;
    active: boolean;
    rates?: { [key: string]: number }; 
};

export default function RatesPage() {
  const firestore = useFirestore();

  const ratesQuery = useMemoFirebase(() => firestore ? collection(firestore, "game_rates") : null, [firestore]);
  const { data: defaultRates, isLoading: isLoadingRates } = useCollection<GameRate>(ratesQuery);

  const marketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "markets"), where("active", "==", true)) : null, [firestore]);
  const { data: markets, isLoading: isLoadingMarkets } = useCollection<Market>(marketsQuery);

  const { marketsWithCustomRates, marketsWithDefaultRates } = useMemo(() => {
    const custom: Market[] = [];
    const standard: Market[] = [];
    markets?.forEach(market => {
      if (market.rates && Object.keys(market.rates).length > 0) {
        custom.push(market);
      } else {
        standard.push(market);
      }
    });
    return { marketsWithCustomRates: custom, marketsWithDefaultRates: standard };
  }, [markets]);

  const isLoading = isLoadingRates || isLoadingMarkets;

  return (
    <div className="flex flex-col gap-6">
      {/* Default Rates Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><Coins className="h-6 w-6" /><span>Default Payout Rates</span></CardTitle>
          <CardDescription className="text-white/80">These are the standard payout rates for most markets.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border border-white/20">
            <Table>
              <TableHeader className="border-b border-white/20">
                <TableRow>
                  <TableHead className="text-base text-white">Game Type</TableHead>
                  <TableHead className="text-right text-base text-white">Payout Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRates ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-0">
                    <TableCell className="py-4"><Skeleton className="h-5 w-24 bg-white/20" /></TableCell>
                    <TableCell className="py-4"><Skeleton className="h-5 w-32 bg-white/20 ml-auto" /></TableCell>
                  </TableRow>
                )) : defaultRates?.map((item) => (
                  <TableRow key={item.id} className="border-0">
                    <TableCell className="font-medium text-base text-white/90 py-4">{item.name}</TableCell>
                    <TableCell className="text-right font-semibold text-green-300 text-base py-4">
                      ₹{item.betAmount} ka ₹{item.payoutAmount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Special Rates Card */}
      {isLoadingMarkets ? <Skeleton className="h-40 w-full bg-white/10 rounded-lg"/> : marketsWithCustomRates.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white"><Tag className="h-6 w-6" /><span>Special Rate Markets</span></CardTitle>
            <CardDescription className="text-white/80">These markets have unique payout rates.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketsWithCustomRates.map(market => (
              <div key={market.id} className="bg-black/20 p-4 rounded-lg">
                <h3 className="font-bold text-lg text-yellow-300">{market.name}</h3>
                <div className="border-t border-white/20 my-2"></div>
                <ul className="space-y-1 text-sm">
                  {defaultRates?.map(rateType => {
                     const customRate = market.rates?.[rateType.name];
                     return (
                        <li key={rateType.id} className="flex justify-between">
                          <span className="text-white/80">{rateType.name}:</span>
                          <span className={cn("font-bold", customRate ? "text-yellow-300" : "text-green-300")}>
                            ₹{rateType.betAmount} ka ₹{customRate || rateType.payoutAmount}
                          </span>
                        </li>
                     )
                  })}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Default Rate Markets List */}
      {isLoadingMarkets ? <Skeleton className="h-20 w-full bg-white/10 rounded-lg"/> : marketsWithDefaultRates.length > 0 && (
         <Card className="bg-gray-700/50 border-gray-600">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-white text-base"><Store className="h-5 w-5" />Markets on Default Rate</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 p-4 pt-0">
              {marketsWithDefaultRates.map(market => (
                <Badge key={market.id} variant="secondary" className="bg-gray-600 text-white/80">{market.name}</Badge>
              ))}
            </CardContent>
          </Card>
      )}
       <p className="text-xs text-muted-foreground mt-4 text-center">
          Disclaimer: Rates are for informational purposes and subject to change. Confirm rates before placing a bet. Playing may not be legal in your jurisdiction.
      </p>
    </div>
  );
}
