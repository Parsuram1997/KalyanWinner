
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";

const results = [
    { id: 1, date: "2024-07-26", market: "Kalyan Day", openPanna: "128", jodi: "13", closePanna: "490" },
    { id: 2, date: "2024-07-26", market: "Kalyan Night", openPanna: "345", jodi: "21", closePanna: "678" },
    { id: 3, date: "2024-07-25", market: "Kalyan Day", openPanna: "579", jodi: "18", closePanna: "224" },
];

export default function EnterResultsPage() {
    const {toast} = useToast();
    const params = useParams();
    const marketSlug = params.market as string;
    const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Result Added",
            description: `The new result for ${marketName} has been added successfully.`,
        });
    }

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Add Result for {marketName}</CardTitle>
                <CardDescription>Enter the details for the game result.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div>
                        <Label htmlFor="open-panna">Open Panna</Label>
                        <Input id="open-panna" placeholder="e.g., 123" />
                    </div>
                    <div>
                        <Label htmlFor="close-panna">Close Panna</Label>
                        <Input id="close-panna" placeholder="e.g., 456" />
                    </div>
                    <Button type="submit" className="w-full">Add Result</Button>
                </form>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Results for {marketName}</CardTitle>
            <CardDescription>View and manage recent game results.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Open Panna</TableHead>
                    <TableHead>Jodi</TableHead>
                    <TableHead>Close Panna</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {results.filter(r => r.market === marketName).map((result) => (
                    <TableRow key={result.id}>
                        <TableCell>{result.date}</TableCell>
                        <TableCell className="font-mono">{result.openPanna}</TableCell>
                        <TableCell className="font-bold text-primary font-mono">{result.jodi}</TableCell>
                        <TableCell className="font-mono">{result.closePanna}</TableCell>
                        <TableCell className="flex gap-2">
                        <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            
            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
                {results.filter(r => r.market === marketName).map((result) => (
                    <div key={result.id} className="rounded-lg border bg-card text-card-foreground p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{result.market}</p>
                                <p className="text-sm text-muted-foreground">{result.date}</p>
                            </div>
                            <Badge variant={result.market.includes("Night") ? "secondary" : "default"}>{result.market.split(" ")[1]}</Badge>
                        </div>
                        <div className="flex items-center justify-around text-center font-mono">
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground">Open</span>
                                <span className="text-lg font-bold">{result.openPanna}</span>
                            </div>
                             <div className="flex flex-col items-center rounded-md bg-primary px-3 py-1 text-primary-foreground">
                                <span className="text-2xl font-bold tracking-wider">{result.jodi}</span>
                                <span className="text-[10px] font-medium">Jodi</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground">Close</span>
                                <span className="text-lg font-bold">{result.closePanna}</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                        </div>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
