"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Hash, Ticket } from "lucide-react";

// Mock data for number-wise bets. In a real app, this would come from an API.
const generateDigitBets = () => {
    const bets = [];
    for (let i = 0; i < 10; i++) {
        bets.push({
            digit: i.toString(),
            openAmount: Math.floor(Math.random() * 5000) + 100,
            closeAmount: Math.floor(Math.random() * 5000) + 100,
        });
    }
    return bets;
};

const generateJodiBets = () => {
    const bets = [];
    for (let i = 0; i < 100; i++) {
        bets.push({
            jodi: i.toString().padStart(2, '0'),
            amount: Math.floor(Math.random() * 1000) + 5,
        });
    }
    return bets;
};

const pannaStats = [
  { name: "Single Panna", totalBets: "1,250", totalAmount: "₹2,50,000" },
  { name: "Double Panna", totalBets: "980", totalAmount: "₹1,96,000" },
  { name: "Triple Panna", totalBets: "450", totalAmount: "₹1,20,000" },
  { name: "Half Sangam", totalBets: "150", totalAmount: "₹75,000" },
  { name: "Full Sangam", totalBets: "50", totalAmount: "₹50,000" },
];


export default function ManageBetsPage() {
    const [digitBets, setDigitBets] = useState<ReturnType<typeof generateDigitBets>>([]);
    const [jodiBets, setJodiBets] = useState<ReturnType<typeof generateJodiBets>>([]);

    useEffect(() => {
        setDigitBets(generateDigitBets());
        setJodiBets(generateJodiBets());
    }, []);

  return (
    <div className="flex flex-col gap-6">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            <span>Betting Summary</span>
          </CardTitle>
          <CardDescription>
            An overview of total bets placed across different game types and numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="single-digit">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="single-digit">Single Digit (Ank)</TabsTrigger>
                    <TabsTrigger value="jodi">Jodi</TabsTrigger>
                    <TabsTrigger value="panna">Panna</TabsTrigger>
                </TabsList>

                <TabsContent value="single-digit">
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Single Digit Bet Amounts</CardTitle>
                            <CardDescription>Total amount placed on each digit for Open and Close.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/3">Digit</TableHead>
                                        <TableHead className="w-1/3 text-right">Open Amount</TableHead>
                                        <TableHead className="w-1/3 text-right">Close Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {digitBets.map((bet) => (
                                        <TableRow key={bet.digit}>
                                            <TableCell className="font-mono font-bold text-lg">{bet.digit}</TableCell>
                                            <TableCell className="text-right">₹{bet.openAmount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">₹{bet.closeAmount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="jodi">
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Jodi Bet Amounts</CardTitle>
                            <CardDescription>Total amount placed on each Jodi number (00-99).</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-4">
                                {jodiBets.map((bet) => (
                                    <div key={bet.jodi} className="p-2 border rounded-md text-center bg-muted/50">
                                        <div className="font-mono font-bold text-lg">{bet.jodi}</div>
                                        <div className="text-xs text-muted-foreground">₹{bet.amount.toLocaleString()}</div>
                                    </div>
                                ))}
                           </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="panna">
                     <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Panna & Sangam Bet Summary</CardTitle>
                            <CardDescription>Total bets and amounts for Panna and Sangam types.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {pannaStats.map((stat) => (
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
                </TabsContent>

            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
