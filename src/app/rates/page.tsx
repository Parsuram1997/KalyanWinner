
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

const rates = [
    { game: "Single Digit (Ank)", rate: "₹95" },
    { game: "Jodi", rate: "₹950" },
    { game: "Single Panna (SP)", rate: "₹1,400" },
    { game: "Double Panna (DP)", rate: "₹2,800" },
    { game: "Triple Panna (TP)", rate: "₹7,000" },
    { game: "Half Sangam", rate: "₹10,000" },
    { game: "Full Sangam", rate: "₹1,00,000" },
];


export default function RatesPage() {
  return (
    <div className="flex justify-center items-start p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            <span>Kalyan Matka Payout Rates</span>
          </CardTitle>
          <CardDescription>
            The rates below show the payout for a winning bet of ₹10.
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
                {rates.map((item) => (
                  <TableRow key={item.game}>
                    <TableCell className="font-medium text-base">{item.game}</TableCell>
                    <TableCell className="text-right font-semibold text-primary text-base">
                      {item.rate}
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
