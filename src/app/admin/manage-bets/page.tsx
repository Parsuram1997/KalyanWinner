"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Hash, Ticket } from "lucide-react";

const betStats = [
  { name: "Single Digit", totalBets: "3,500", totalAmount: "₹3,50,000" },
  { name: "Jodi", totalBets: "2,100", totalAmount: "₹4,20,000" },
  { name: "Open Panna", totalBets: "1,250", totalAmount: "₹2,50,000" },
  { name: "Close Panna", totalBets: "980", totalAmount: "₹1,96,000" },
  { name: "Half Sangam", totalBets: "150", totalAmount: "₹75,000" },
  { name: "Full Sangam", totalBets: "50", totalAmount: "₹50,000" },
];

export default function ManageBetsPage() {
  return (
    <div className="flex flex-col gap-6">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            <span>Betting Summary</span>
          </CardTitle>
          <CardDescription>
            An overview of total bets and amounts placed across different game types.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {betStats.map((stat) => (
            <Card key={stat.name}>
                <CardHeader>
                    <CardTitle className="text-lg">{stat.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-3">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Bets</p>
                            <p className="text-xl font-bold">{stat.totalBets}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-xl font-bold">{stat.totalAmount}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
