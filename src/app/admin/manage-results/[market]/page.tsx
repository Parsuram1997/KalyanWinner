
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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { createKalyanResult, deleteKalyanResult } from "@/app/actions/result-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

type KalyanResult = {
  id: string;
  date: string;
  marketName: string;
  openPanna: string;
  jodi: string;
  closePanna: string;
};

export default function EnterResultsPage() {
    const {toast} = useToast();
    const params = useParams();
    const marketSlug = params.market as string;
    const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const firestore = useFirestore();
    const resultsQuery = useMemoFirebase(
        () => firestore 
                ? query(
                    collection(firestore, 'kalyan_results'), 
                    where('marketName', '==', marketName),
                    orderBy('date', 'desc')
                  ) 
                : null,
        [firestore, marketName]
    );
    const { data: results, isLoading } = useCollection<KalyanResult>(resultsQuery);

    const [openPanna, setOpenPanna] = useState('');
    const [closePanna, setClosePanna] = useState('');

    const getPannaSum = (panna: string) => {
        if (panna.length !== 3 || !/^\d+$/.test(panna)) return '';
        return panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
    };
    
    const jodiNumber = `${getPannaSum(openPanna)}${getPannaSum(closePanna)}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const date = formData.get("date") as string;
        
        if (!date || !openPanna || !closePanna) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all result fields." });
            return;
        }

        try {
            await createKalyanResult({
                date,
                marketName,
                openPanna,
                closePanna,
                jodi: jodiNumber
            });
            toast({
                title: "Result Added",
                description: `The new result for ${marketName} has been added successfully.`,
            });
            form.reset();
            setOpenPanna('');
            setClosePanna('');
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Failed to Add Result",
                description: error.message || "An unexpected error occurred.",
            });
        }
    }
    
    const handleDelete = async (resultId: string) => {
      try {
        await deleteKalyanResult(resultId);
        toast({
          title: "Result Deleted",
          description: "The result has been successfully deleted.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to Delete Result",
          description: error.message || "An unexpected error occurred.",
        });
      }
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
                        <Input name="date" id="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div>
                        <Label htmlFor="open-panna">Open Panna</Label>
                        <Input name="openPanna" id="open-panna" placeholder="e.g., 123" value={openPanna} onChange={(e) => setOpenPanna(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="close-panna">Close Panna</Label>
                        <Input name="closePanna" id="close-panna" placeholder="e.g., 456" value={closePanna} onChange={(e) => setClosePanna(e.target.value)} />
                    </div>
                     <div>
                        <Label htmlFor="jodi">Jodi (Auto-calculated)</Label>
                        <Input id="jodi" value={jodiNumber} readOnly disabled />
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
                    {isLoading ? (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center">Loading results...</TableCell>
                         </TableRow>
                    ) : results?.length ? results.map((result) => (
                    <TableRow key={result.id}>
                        <TableCell>{new Date(result.date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell className="font-mono">{result.openPanna}</TableCell>
                        <TableCell className="font-bold text-primary font-mono">{result.jodi}</TableCell>
                        <TableCell className="font-mono">{result.closePanna}</TableCell>
                        <TableCell className="flex gap-2">
                        <Button variant="outline" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the result for {result.date}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(result.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </TableCell>
                    </TableRow>
                    )) : (
                        <TableRow>
                           <TableCell colSpan={5} className="text-center">No results found for this market.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            
            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
                {isLoading ? <p className="text-center">Loading results...</p> :
                 results?.length ? results.map((result) => (
                    <div key={result.id} className="rounded-lg border bg-card text-card-foreground p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{result.marketName}</p>
                                <p className="text-sm text-muted-foreground">{new Date(result.date).toLocaleDateString('en-GB')}</p>
                            </div>
                            <Badge variant={result.marketName.includes("Night") ? "secondary" : "default"}>{result.marketName.split(" ")[1]}</Badge>
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
                            <Button variant="outline" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the result for {result.date}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(result.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )) : <p className="text-center text-muted-foreground pt-4">No results found for this market.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    