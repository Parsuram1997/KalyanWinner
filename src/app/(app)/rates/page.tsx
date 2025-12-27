
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

// --- TYPE DEFINITIONS ---
type GameRate = {
  id: string;
  name: string;
  betAmount: number;
  payoutAmount: number;
};

// Using the correct field `status` with string values "Active" / "Inactive"
type BetType = {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

type Market = {
    id: string;
    name: string;
    active: boolean;
    rates?: { [key: string]: number }; 
};

export default function RatesPage() {
  const firestore = useFirestore();

  // 1. Fetch all default game rates
  const allRatesQuery = useMemoFirebase(() => firestore ? collection(firestore, "game_rates") : null, [firestore]);
  const { data: allRates, isLoading: isLoadingRates } = useCollection<GameRate>(allRatesQuery);

  // 2. Fetch only the active bet types from the `bet_types` collection
  const betTypesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, "bet_types"), where("status", "==", "Active")) : null, 
  [firestore]);
  const { data: activeBetTypes, isLoading: isLoadingBetTypes } = useCollection<BetType>(betTypesQuery);

  // 3. Fetch active markets
  const marketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "markets"), where("active", "==", true)) : null, [firestore]);
  const { data: markets, isLoading: isLoadingMarkets } = useCollection<Market>(marketsQuery);

  // 4. Filter default rates to only include active ones
  const activeDefaultRates = useMemo(() => {
    if (!allRates || !activeBetTypes) return [];
    const activeBetTypeNames = activeBetTypes.map(bt => bt.name);
    return allRates.filter(rate => activeBetTypeNames.includes(rate.name));
  }, [allRates, activeBetTypes]);

  // 5. Group markets by rate type
  const { marketsWithCustomRates, marketsWithDefaultRates } = useMemo(() => {
    if (!markets) return { marketsWithCustomRates: [], marketsWithDefaultRates: [] };
    const custom: Market[] = [];
    const standard: Market[] = [];
    markets.forEach(market => {
      // Ensure the market has custom rates that are active
      const hasActiveCustomRate = Object.keys(market.rates || {}).some(rateName => 
        activeBetTypes?.some(bt => bt.name === rateName)
      );
      if (market.rates && hasActiveCustomRate) {
        custom.push(market);
      } else {
        standard.push(market);
      }
    });
    return { marketsWithCustomRates: custom, marketsWithDefaultRates: standard };
  }, [markets, activeBetTypes]);

  const isLoading = isLoadingRates || isLoadingMarkets || isLoadingBetTypes;

  return (
    <div className="flex flex-col gap-6">
      {/* Default Rates Card - Dynamically filtered by `status` */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><Coins className="h-6 w-6" /><span>Default Payout Rates</span></CardTitle>
          <CardDescription className="text-white/80">Showing standard payout rates for currently active bet types.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
           {isLoading ? (
              <div className="p-4"><Skeleton className="h-40 w-full bg-white/20 rounded-md"/></div>
           ) : activeDefaultRates && activeDefaultRates.length > 0 ? (
              <div className="rounded-md border border-white/20">
                <Table>
                  <TableHeader className="border-b border-white/20">
                    <TableRow>
                      <TableHead className="text-base text-white">Game Type</TableHead>
                      <TableHead className="text-right text-base text-white">Payout Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDefaultRates.map((item) => (
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
            ) : (
                <div className="text-center p-6 text-white/70">No active game rates found.</div>
            )}
        </CardContent>
      </Card>

      {/* Special Rates Card - Dynamically filtered by `status` */}
      {isLoading ? <Skeleton className="h-40 w-full bg-white/10 rounded-lg"/> : marketsWithCustomRates.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white"><Tag className="h-6 w-6" /><span>Special Rate Markets</span></CardTitle>
            <CardDescription className="text-white/80">These markets have unique payout rates for active bet types.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketsWithCustomRates.map(market => {
              return (
                <div key={market.id} className="bg-black/20 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-yellow-300">{market.name}</h3>
                  <div className="border-t border-white/20 my-2"></div>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(market.rates || {}).map(([rateName, payoutAmount]) => {
                      const isActive = activeBetTypes?.some(bt => bt.name === rateName);
                      if (!isActive) return null; 

                      const defaultRateInfo = allRates?.find(r => r.name === rateName);
                      const betAmount = defaultRateInfo?.betAmount || 1;

                      return (
                          <li key={rateName} className="flex justify-between">
                            <span className="text-white/80">{rateName}:</span>
                            <span className="font-bold text-yellow-300">
                              ₹{betAmount} ka ₹{payoutAmount}
                            </span>
                          </li>
                      );
                    })}
                  </ul>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Default Rate Markets List */}
      {isLoading ? <Skeleton className="h-20 w-full bg-white/10 rounded-lg"/> : marketsWithDefaultRates.length > 0 && (
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
