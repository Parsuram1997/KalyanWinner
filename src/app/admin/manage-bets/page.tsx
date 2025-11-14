"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket } from "lucide-react";

// --- Mock Data Generation ---

// For Open/Close Single Digit
const generateSingleDigitBets = () => {
    const bets = [];
    for (let i = 0; i < 10; i++) {
        bets.push({
            digit: i.toString(),
            amount: Math.floor(Math.random() * 5000) + 100,
        });
    }
    return bets;
};

// For Jodi
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

// For Panna (Open/Close)
const generatePannaBets = () => {
    const bets = [];
    // Generating a smaller, more readable list for the example
    for (let i = 0; i < 20; i++) {
        let panna = Math.floor(Math.random() * 900) + 100;
        bets.push({
            panna: panna.toString(),
            amount: Math.floor(Math.random() * 500) + 10,
        });
    }
    return bets.sort((a,b) => parseInt(a.panna) - parseInt(b.panna));
};

// For Sangam (Half/Full)
const generateSangamBets = (isFullSangam = false) => {
     const bets = [];
     for (let i = 0; i < 15; i++) {
        let openPanna = (Math.floor(Math.random() * 900) + 100).toString();
        let closeDigitOrPanna = isFullSangam 
            ? (Math.floor(Math.random() * 900) + 100).toString() 
            : (Math.floor(Math.random() * 10)).toString();
        
        bets.push({
            sangam: `${openPanna} x ${closeDigitOrPanna}`,
            amount: Math.floor(Math.random() * 2000) + 50,
        });
     }
     return bets;
}


// --- Components for each Tab ---

const SingleDigitTable = ({ data, type }: { data: { digit: string; amount: number; }[], type: string }) => (
    <Card className="mt-4">
        <CardHeader>
            <CardTitle>{type} Digit Bet Amounts</CardTitle>
            <CardDescription>Total amount placed on each digit for {type}.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/2">Digit</TableHead>
                        <TableHead className="w-1/2 text-right">Total Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((bet) => (
                        <TableRow key={bet.digit}>
                            <TableCell className="font-mono font-bold text-lg">{bet.digit}</TableCell>
                            <TableCell className="text-right">₹{bet.amount.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const JodiGrid = ({ data }: { data: { jodi: string; amount: number; }[] }) => (
    <Card className="mt-4">
        <CardHeader>
            <CardTitle>Jodi Bet Amounts</CardTitle>
            <CardDescription>Total amount placed on each Jodi number (00-99).</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-4">
                {data.map((bet) => (
                    <div key={bet.jodi} className="p-2 border rounded-md text-center bg-muted/50">
                        <div className="font-mono font-bold text-lg">{bet.jodi}</div>
                        <div className="text-xs text-muted-foreground">₹{bet.amount.toLocaleString()}</div>
                    </div>
                ))}
           </div>
        </CardContent>
    </Card>
);

const PannaTable = ({ data, type }: { data: { panna: string; amount: number; }[], type: string }) => (
     <Card className="mt-4">
        <CardHeader>
            <CardTitle>{type} Bet Amounts</CardTitle>
            <CardDescription>Total amount placed on each {type} number.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/2">Panna</TableHead>
                        <TableHead className="w-1/2 text-right">Total Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((bet, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-mono font-bold">{bet.panna}</TableCell>
                            <TableCell className="text-right">₹{bet.amount.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
)

const SangamTable = ({ data, type }: { data: { sangam: string; amount: number; }[], type: string }) => (
    <Card className="mt-4">
        <CardHeader>
            <CardTitle>{type} Bet Amounts</CardTitle>
            <CardDescription>Total amount placed on each {type}.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/2">{type === 'Half Sangam' ? 'Open Panna x Close Digit' : 'Open Panna x Close Panna'}</TableHead>
                        <TableHead className="w-1/2 text-right">Total Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((bet, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-mono font-bold">{bet.sangam}</TableCell>
                            <TableCell className="text-right">₹{bet.amount.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);


export default function ManageBetsPage() {
    const [openBets, setOpenBets] = useState<ReturnType<typeof generateSingleDigitBets>>([]);
    const [closeBets, setCloseBets] = useState<ReturnType<typeof generateSingleDigitBets>>([]);
    const [jodiBets, setJodiBets] = useState<ReturnType<typeof generateJodiBets>>([]);
    const [openPannaBets, setOpenPannaBets] = useState<ReturnType<typeof generatePannaBets>>([]);
    const [closePannaBets, setClosePannaBets] = useState<ReturnType<typeof generatePannaBets>>([]);
    const [halfSangamBets, setHalfSangamBets] = useState<ReturnType<typeof generateSangamBets>>([]);
    const [fullSangamBets, setFullSangamBets] = useState<ReturnType<typeof generateSangamBets>>([]);


    useEffect(() => {
        setOpenBets(generateSingleDigitBets());
        setCloseBets(generateSingleDigitBets());
        setJodiBets(generateJodiBets());
        setOpenPannaBets(generatePannaBets());
        setClosePannaBets(generatePannaBets());
        setHalfSangamBets(generateSangamBets(false));
        setFullSangamBets(generateSangamBets(true));
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
            <Tabs defaultValue="open">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-7">
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="close">Close</TabsTrigger>
                    <TabsTrigger value="jodi">Jodi</TabsTrigger>
                    <TabsTrigger value="open-panna">Open Panna</TabsTrigger>
                    <TabsTrigger value="close-panna">Close Panna</TabsTrigger>
                    <TabsTrigger value="half-sangam">Half Sangam</TabsTrigger>
                    <TabsTrigger value="full-sangam">Full Sangam</TabsTrigger>
                </TabsList>

                <TabsContent value="open">
                    <SingleDigitTable data={openBets} type="Open" />
                </TabsContent>
                
                <TabsContent value="close">
                     <SingleDigitTable data={closeBets} type="Close" />
                </TabsContent>

                <TabsContent value="jodi">
                    <JodiGrid data={jodiBets} />
                </TabsContent>

                <TabsContent value="open-panna">
                    <PannaTable data={openPannaBets} type="Open Panna" />
                </TabsContent>

                <TabsContent value="close-panna">
                    <PannaTable data={closePannaBets} type="Close Panna" />
                </TabsContent>
                
                <TabsContent value="half-sangam">
                    <SangamTable data={halfSangamBets} type="Half Sangam" />
                </TabsContent>

                <TabsContent value="full-sangam">
                     <SangamTable data={fullSangamBets} type="Full Sangam" />
                </TabsContent>

            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
