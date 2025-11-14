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

// For Panna (Single, Double, Triple)
const generatePannaBets = (type: "single" | "double" | "triple") => {
    const bets = [];
    const generatedPannas = new Set<string>();

    const isValidPanna = (panna: string) => {
        const digits = panna.split('');
        if (type === "single") {
            return digits[0] !== digits[1] && digits[1] !== digits[2] && digits[0] !== digits[2];
        }
        if (type === "double") {
            const d = digits.map(Number).sort();
            return (d[0] === d[1] && d[1] !== d[2]) || (d[1] === d[2] && d[0] !== d[1]);
        }
        if (type === "triple") {
            return digits[0] === digits[1] && digits[1] === digits[2];
        }
        return false;
    };
    
    let attempts = 0;
    while (bets.length < 15 && attempts < 1000) {
        let panna;
        if (type === "triple") {
            const digit = Math.floor(Math.random() * 10);
            panna = `${digit}${digit}${digit}`;
        } else {
             panna = (Math.floor(Math.random() * 900) + 100).toString();
             // Ensure panna is 3 digits, handling cases like "012"
             while (panna.length < 3) {
                panna = `0${panna}`;
             }
        }

        if (isValidPanna(panna) && !generatedPannas.has(panna)) {
            generatedPannas.add(panna);
            bets.push({
                panna: panna,
                amount: Math.floor(Math.random() * 500) + 10,
            });
        }
        attempts++;
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

const JodiTable = ({ data }: { data: { jodi: string; amount: number; }[] }) => (
    <Card className="mt-4">
        <CardHeader>
            <CardTitle>Jodi Bet Amounts</CardTitle>
            <CardDescription>Total amount placed on each Jodi number (00-99).</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/2">Jodi</TableHead>
                        <TableHead className="w-1/2 text-right">Total Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((bet) => (
                        <TableRow key={bet.jodi}>
                            <TableCell className="font-mono font-bold text-lg">{bet.jodi}</TableCell>
                            <TableCell className="text-right">₹{bet.amount.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
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
    const [singlePannaBets, setSinglePannaBets] = useState<ReturnType<typeof generatePannaBets>>([]);
    const [doublePannaBets, setDoublePannaBets] = useState<ReturnType<typeof generatePannaBets>>([]);
    const [triplePannaBets, setTriplePannaBets] = useState<ReturnType<typeof generatePannaBets>>([]);
    const [halfSangamBets, setHalfSangamBets] = useState<ReturnType<typeof generateSangamBets>>([]);
    const [fullSangamBets, setFullSangamBets] = useState<ReturnType<typeof generateSangamBets>>([]);


    useEffect(() => {
        setOpenBets(generateSingleDigitBets());
        setCloseBets(generateSingleDigitBets());
        setJodiBets(generateJodiBets());
        setSinglePannaBets(generatePannaBets("single"));
        setDoublePannaBets(generatePannaBets("double"));
        setTriplePannaBets(generatePannaBets("triple"));
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
                <div className="flex flex-col gap-1 items-center">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="open">Open</TabsTrigger>
                        <TabsTrigger value="close">Close</TabsTrigger>
                        <TabsTrigger value="jodi">Jodi</TabsTrigger>
                    </TabsList>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="single-panna">SP</TabsTrigger>
                        <TabsTrigger value="double-panna">DP</TabsTrigger>
                        <TabsTrigger value="triple-panna">TP</TabsTrigger>
                    </TabsList>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="half-sangam">Half Sangam</TabsTrigger>
                        <TabsTrigger value="full-sangam">Full Sangam</TabsTrigger>
                    </TabsList>
                </div>
                

                <TabsContent value="open">
                    <SingleDigitTable data={openBets} type="Open" />
                </TabsContent>
                
                <TabsContent value="close">
                     <SingleDigitTable data={closeBets} type="Close" />
                </TabsContent>

                <TabsContent value="jodi">
                    <JodiTable data={jodiBets} />
                </TabsContent>

                <TabsContent value="single-panna">
                    <PannaTable data={singlePannaBets} type="Single Panna" />
                </TabsContent>
                
                <TabsContent value="double-panna">
                    <PannaTable data={doublePannaBets} type="Double Panna" />
                </TabsContent>

                <TabsContent value="triple-panna">
                    <PannaTable data={triplePannaBets} type="Triple Panna" />
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
