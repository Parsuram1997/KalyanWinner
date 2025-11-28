
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            <span>Market Schedule</span>
          </CardTitle>
          <CardDescription>
            All timings are in Indian Standard Time (IST).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="text-sm align-middle h-auto py-0 px-2">Market Name</TableHead>
                  <TableHead colSpan={2} className="text-center text-sm border-b border-l h-auto py-0 px-2">Bidding Time</TableHead>
                  <TableHead colSpan={2} className="text-center text-sm border-b border-l h-auto py-0 px-2">Result Time</TableHead>
                </TableRow>
                 <TableRow>
                  <TableHead className="text-center text-sm border-l h-auto py-0 px-2">Open</TableHead>
                  <TableHead className="text-center text-sm border-l h-auto py-0 px-2">Close</TableHead>
                  <TableHead className="text-center text-sm border-l h-auto py-0 px-2">Open</TableHead>
                  <TableHead className="text-center text-sm border-l h-auto py-0 px-2">Close</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="py-0 px-2">
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="text-center py-0 px-2"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                        <TableCell className="text-center py-0 px-2"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                        <TableCell className="text-center py-0 px-2"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                         <TableCell className="text-center py-0 px-2"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                      </TableRow>
                    ))
                  : markets?.map((market) => (
                      <TableRow key={market.id}>
                        <TableCell className="font-medium text-sm py-0 px-2">
                          {market.name}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-primary text-sm border-l py-0 px-2">
                          {market.openBiddingTime}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-destructive text-sm border-l py-0 px-2">
                          {market.closeBiddingTime}
                        </TableCell>
                         <TableCell className="text-center font-semibold text-primary text-sm border-l py-0 px-2">
                          {market.openResultTime}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-destructive text-sm border-l py-0 px-2">
                          {market.closeResultTime}
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && markets?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-0 px-2"
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
