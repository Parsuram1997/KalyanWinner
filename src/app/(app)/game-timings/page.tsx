
"use client";

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
import { Clock } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Market = {
  id: string;
  name: string;
  openBiddingTime: string;
  openResultTime: string;
  closeBiddingTime: string;
  closeResultTime: string;
};

export default function GameTimingsPage() {
  const firestore = useFirestore();
  const marketsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "markets"), where("status", "==", "Active"))
        : null,
    [firestore]
  );
  const { data: markets, isLoading } = useCollection<Market>(marketsQuery, { skip: !firestore });

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-6 w-6" />
            <span>Market Schedule</span>
          </CardTitle>
          <CardDescription className="text-white/80">
            All timings are in Indian Standard Time (IST).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border border-white/20 overflow-x-auto">
            <Table>
              <TableHeader className="border-b-0">
                <TableRow className="border-b-white/20">
                  <TableHead rowSpan={2} className="text-sm align-middle h-auto py-2 px-3 text-white">Market Name</TableHead>
                  <TableHead colSpan={2} className="text-center text-sm border-b border-l border-white/20 h-auto py-2 px-3 text-white">Bidding Time</TableHead>
                  <TableHead colSpan={2} className="text-center text-sm border-b border-l border-white/20 h-auto py-2 px-3 text-white">Result Time</TableHead>
                </TableRow>
                 <TableRow className="border-b-white/20">
                  <TableHead className="text-center text-sm border-l border-white/20 h-auto py-2 px-3 text-white">Open</TableHead>
                  <TableHead className="text-center text-sm border-l border-white/20 h-auto py-2 px-3 text-white">Close</TableHead>
                  <TableHead className="text-center text-sm border-l border-white/20 h-auto py-2 px-3 text-white">Open</TableHead>
                  <TableHead className="text-center text-sm border-l border-white/20 h-auto py-2 px-3 text-white">Close</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-0">
                        <TableCell className="py-3 px-3">
                          <Skeleton className="h-5 w-24 bg-white/20" />
                        </TableCell>
                        <TableCell className="text-center py-3 px-3 border-l border-white/20"><Skeleton className="h-5 w-16 mx-auto bg-white/20" /></TableCell>
                        <TableCell className="text-center py-3 px-3 border-l border-white/20"><Skeleton className="h-5 w-16 mx-auto bg-white/20" /></TableCell>
                        <TableCell className="text-center py-3 px-3 border-l border-white/20"><Skeleton className="h-5 w-16 mx-auto bg-white/20" /></TableCell>
                        <TableCell className="text-center py-3 px-3 border-l border-white/20"><Skeleton className="h-5 w-16 mx-auto bg-white/20" /></TableCell>
                      </TableRow>
                    ))
                  : markets?.map((market) => (
                      <TableRow key={market.id} className="border-0">
                        <TableCell className="font-medium text-sm py-3 px-3 text-white/90">
                          {market.name}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-sm border-l border-white/20 py-3 px-3 text-green-300">
                          {market.openBiddingTime}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-sm border-l border-white/20 py-3 px-3 text-orange-300">
                          {market.closeBiddingTime}
                        </TableCell>
                         <TableCell className="text-center font-semibold text-sm border-l border-white/20 py-3 px-3 text-green-300">
                          {market.openResultTime}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-sm border-l border-white/20 py-3 px-3 text-orange-300">
                          {market.closeResultTime}
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && markets?.length === 0 && (
                  <TableRow className="border-0">
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-white/70"
                    >
                      No active markets found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
