
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock } from 'lucide-react';

type Market = {
  id: string;
  name: string;
  openTime: string; 
  closeTime: string; 
  openBiddingTime: string;
  closeBiddingTime: string;
  active: boolean;
  days: {
    [key: string]: boolean;
  };
};

const DayDisplay = ({ days }: { days: Market['days'] }) => {
    if (!days) {
        return <span className="text-xs text-yellow-300">Not Set</span>;
    }
    const activeDays = Object.entries(days)
        .filter(([_, isActive]) => isActive)
        .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3));

    if (activeDays.length === 7) return <span className="text-xs text-white/80 font-semibold">All Days</span>;
    if (activeDays.length === 0) return <span className="text-xs text-red-400">No Days</span>

    return <span className="text-xs text-white/80">{activeDays.join(', ')}</span>;
};

export default function GameTimingsPage() {
  const firestore = useFirestore();

  const marketsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "markets"), where("active", "==", true))
        : null,
    [firestore]
  );
  const { data: markets, isLoading } = useCollection<Market>(marketsQuery);

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/> Market Schedule</CardTitle>
          <CardDescription className="text-white/80">Market timings and active days. All times are in IST.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop View: Table (hidden on small screens) */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="border-t border-white/20">
              <TableHeader>
                <TableRow className="bg-black/20 border-0">
                  <TableHead rowSpan={2} className="text-white/90 font-semibold align-middle p-3">Market Name</TableHead>
                  <TableHead rowSpan={2} className="text-white/90 font-semibold align-middle text-center border-l border-white/20 p-3">Active Days</TableHead>
                  <TableHead colSpan={2} className="text-white/90 font-semibold text-center border-l border-white/20 p-2">Bidding Time</TableHead>
                  <TableHead colSpan={2} className="text-white/90 font-semibold text-center border-l border-white/20 p-2">Result Time</TableHead>
                </TableRow>
                <TableRow className="bg-black/20 border-0">
                  <TableHead className="text-white/90 font-semibold text-center border-l border-white/20 p-2">Open</TableHead>
                  <TableHead className="text-white/90 font-semibold text-center border-l border-white/20 p-2">Close</TableHead>
                  <TableHead className="text-white/90 font-semibold text-center border-l border-white/20 p-2">Open</TableHead>
                  <TableHead className="text-white/90 font-semibold text-center border-l border-white/20 p-2">Close</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-0">
                    <TableCell className="p-3"><Skeleton className="h-5 w-28 bg-white/20" /></TableCell>
                    <TableCell className="p-3 text-center border-l border-white/20"><Skeleton className="h-5 w-20 mx-auto bg-white/20" /></TableCell>
                    <TableCell className="p-3 text-center border-l border-white/20"><Skeleton className="h-5 w-16 mx-auto bg-white/20" /></TableCell>
                    <TableCell className="p-3 text-center border-l border-white/20"><Skeleton className="h-5 w-16 mx-auto bg-white/20" /></TableCell>
                    <TableCell className="p-3 text-center border-l border-white/20"><Skeleton className="h-5 w-16 mx-auto bg-white/20" /></TableCell>
                    <TableCell className="p-3 text-center border-l border-white/20"><Skeleton className="h-5 w-16 mx-auto bg-white/20" /></TableCell>
                  </TableRow>
                )) : markets?.map((market) => (
                  <TableRow key={market.id} className="border-0">
                    <TableCell className="font-medium text-sm py-3 px-3 text-white/90">{market.name}</TableCell>
                    <TableCell className="text-center border-l border-white/20 py-3 px-3"><DayDisplay days={market.days} /></TableCell>
                    <TableCell className="text-center font-semibold text-sm border-l border-white/20 py-3 px-3 text-green-300">{market.openBiddingTime}</TableCell>
                    <TableCell className="text-center font-semibold text-sm border-l border-white/20 py-3 px-3 text-orange-300">{market.closeBiddingTime}</TableCell>
                    <TableCell className="text-center font-semibold text-sm border-l border-white/20 py-3 px-3 text-cyan-300">{market.openTime}</TableCell>
                    <TableCell className="text-center font-semibold text-sm border-l border-white/20 py-3 px-3 text-pink-300">{market.closeTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View: Card List (only on small screens) */}
          <div className="md:hidden flex flex-col gap-px border-t border-white/20">
             {isLoading ? [...Array(5)].map((_, i) => (
                <div key={i} className="bg-black/20 p-4">
                    <Skeleton className="h-6 w-40 mb-2 bg-white/30" />
                    <Skeleton className="h-4 w-24 mb-4 bg-white/30" />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <Skeleton className="h-4 w-full bg-white/30" />
                        <Skeleton className="h-4 w-full bg-white/30" />
                        <Skeleton className="h-4 w-full bg-white/30" />
                        <Skeleton className="h-4 w-full bg-white/30" />
                    </div>
                </div>
             )) : markets?.map((market) => (
                <div key={market.id} className="bg-black/20 p-4">
                    <h3 className="font-bold text-white">{market.name}</h3>
                    <DayDisplay days={market.days} />
                    <div className="grid grid-cols-2 gap-x-4 mt-3 text-sm">
                        <div className="flex flex-col">
                            <span className="text-white/70">Bidding Open</span>
                            <span className="font-semibold text-green-300">{market.openBiddingTime}</span>
                        </div>
                         <div className="flex flex-col">
                            <span className="text-white/70">Bidding Close</span>
                            <span className="font-semibold text-orange-300">{market.closeBiddingTime}</span>
                        </div>
                        <div className="flex flex-col mt-2">
                            <span className="text-white/70">Result Open</span>
                            <span className="font-semibold text-cyan-300">{market.openTime}</span>
                        </div>
                        <div className="flex flex-col mt-2">
                            <span className="text-white/70">Result Close</span>
                            <span className="font-semibold text-pink-300">{market.closeTime}</span>
                        </div>
                    </div>
                </div>
            ))}
          </div>

          {/* Common Message for both views if no markets */}
          {!isLoading && markets?.length === 0 && (
            <div className="text-center py-12 text-white/70">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-yellow-400"/>
                <span className="font-semibold">No Active Markets</span>
                <p className="text-sm">There are no markets open for bidding currently.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
