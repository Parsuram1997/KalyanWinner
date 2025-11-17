
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

type Market = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
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
  const { data: markets, isLoading } = useCollection<Market>(marketsQuery);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Game Timings</h1>
        <p className="text-muted-foreground">
          A schedule of open and close times for all active markets.
        </p>
      </div>
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
                  <TableHead className="text-base">Market Name</TableHead>
                  <TableHead className="text-center text-base">Open Time</TableHead>
                  <TableHead className="text-center text-base">Close Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading timings...</TableCell>
                  </TableRow>
                ) : markets?.map((market) => (
                  <TableRow key={market.id}>
                    <TableCell className="font-medium text-base">{market.name}</TableCell>
                    <TableCell className="text-center font-semibold text-primary text-base">
                      {market.openTime}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-destructive text-base">
                      {market.closeTime}
                    </TableCell>
                  </TableRow>
                ))}
                 {!isLoading && markets?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
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
