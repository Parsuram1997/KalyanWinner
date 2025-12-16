
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
import { Coins } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

type GameRate = {
  id: string;
  name: string;
  betAmount: number;
  payoutAmount: number;
};

export default function RatesPage() {
  const firestore = useFirestore();
  const ratesQuery = useMemoFirebase(() => firestore ? collection(firestore, "game_rates") : null, [firestore]);
  const { data: rates, isLoading } = useCollection<GameRate>(ratesQuery, { skip: !firestore });

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Coins className="h-6 w-6" />
            <span>Payout Rates</span>
          </CardTitle>
          <CardDescription className="text-white/80">
            The rates below show the payout for a winning bet.
          </CardDescription>
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-0">
                      <TableCell className="py-4"><Skeleton className="h-5 w-24 bg-white/20" /></TableCell>
                      <TableCell className="py-4"><Skeleton className="h-5 w-32 bg-white/20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : rates?.map((item) => (
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
           <p className="text-xs text-white/70 mt-4 px-6 sm:px-0">
            Disclaimer: These rates are for informational purposes only and are subject to change. Please confirm the rates before placing a bet. Playing Matka is a game of chance and may not be legal in your jurisdiction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
