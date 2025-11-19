
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

type GameRate = {
  id: string;
  name: string;
  betAmount: number;
  payoutAmount: number;
};

export default function GameRatesPage() {
  const firestore = useFirestore();
  const ratesQuery = useMemoFirebase(() => firestore ? collection(firestore, "game_rates") : null, [firestore]);
  const { data: rates, isLoading } = useCollection<GameRate>(ratesQuery, { skip: !firestore });

  return (
    <div className="flex justify-center items-start p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            <span>Kalyan Matka Payout Rates</span>
          </CardTitle>
          <CardDescription>
            The rates below show the payout for a winning bet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">Game Type</TableHead>
                  <TableHead className="text-right text-base">Payout Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">Loading rates...</TableCell>
                  </TableRow>
                ) : rates?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-base">{item.name}</TableCell>
                    <TableCell className="text-right font-semibold text-primary text-base">
                      ₹{item.betAmount} ka ₹{item.payoutAmount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           <p className="text-xs text-muted-foreground mt-4">
            Disclaimer: These rates are for informational purposes only and are subject to change. Please confirm the rates before placing a bet. Playing Matka is a game of chance and may not be legal in your jurisdiction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    