
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
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="text-base align-middle">Market Name</TableHead>
                  <TableHead colSpan={2} className="text-center text-base border-b border-l">Bidding Time</TableHead>
                  <TableHead colSpan={2} className="text-center text-base border-b border-l">Result Time</TableHead>
                </TableRow>
                 <TableRow>
                  <TableHead className="text-center text-base border-l">Open</TableHead>
                  <TableHead className="text-center text-base border-l">Close</TableHead>
                  <TableHead className="text-center text-base border-l">Open</TableHead>
                  <TableHead className="text-center text-base border-l">Close</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                         <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                      </TableRow>
                    ))
                  : markets?.map((market) => (
                      <TableRow key={market.id}>
                        <TableCell className="font-medium text-base">
                          {market.name}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-primary text-base border-l">
                          {market.openBiddingTime}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-destructive text-base border-l">
                          {market.closeBiddingTime}
                        </TableCell>
                         <TableCell className="text-center font-semibold text-primary text-base border-l">
                          {market.openResultTime}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-destructive text-base border-l">
                          {market.closeResultTime}
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && markets?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
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
