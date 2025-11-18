
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
import { collection, query, where } from "firebase/firestore";
import { createKalyanResult, deleteKalyanResult, updateKalyanResult } from "@/app/actions/result-actions";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useMemo, useEffect } from "react";

type KalyanResult = {
  id: string;
  date: string;
  marketName: string;
  openPanna: string;
  jodi: string;
  closePanna: string;
};

const getPannaSum = (panna: string) => {
    if (panna.length !== 3 || !/^\d+$/.test(panna)) return '';
    return panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
};


export default function EnterResultsPage() {
    const {toast} = useToast();
    const params = useParams();
    const marketSlug = params.market as string;
    const marketName = marketSlug.split('-').map(word => {
        if (word.toLowerCase() === 'bazar') return 'Bazar';
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');

    const firestore = useFirestore();
    const resultsQuery = useMemoFirebase(
        () => firestore 
                ? query(
                    collection(firestore, 'kalyan_results'), 
                    where('marketName', '==', marketName)
                  ) 
                : null,
        [firestore, marketName]
    );
    const { data: results, isLoading } = useCollection<KalyanResult>(resultsQuery);

    const sortedResults = useMemo(() => {
        if (!results) return [];
        return [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [results]);

    const [openPanna, setOpenPanna] = useState('');
    const [isAddOpenResultDialogOpen, setAddOpenResultDialogOpen] = useState(false);
    const [isUpdateResultDialogOpen, setUpdateResultDialogOpen] = useState(false);
    const [selectedResult, setSelectedResult] = useState<KalyanResult | null>(null);
    const [updateClosePanna, setUpdateClosePanna] = useState("");

    const handleSubmitOpenResult = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const date = formData.get("date") as string;
        
        if (!date || !openPanna) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all result fields." });
            return;
        }

        try {
            await createKalyanResult({
                date,
                marketName: marketName.trim(),
                openPanna,
            }, marketSlug);
            toast({
                title: "Open Result Added",
                description: `The open panna for ${marketName} has been added.`,
            });
            form.reset();
            setOpenPanna('');
            setAddOpenResultDialogOpen(false);
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Failed to Add Result",
                description: error.message || "An unexpected error occurred.",
            });
        }
    }
    
    const handleUpdateResult = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedResult || !updateClosePanna) {
        toast({ variant: "destructive", title: "Missing Fields", description: "Please enter the close panna." });
        return;
      }
      
      const newJodi = `${getPannaSum(selectedResult.openPanna)}${getPannaSum(updateClosePanna)}`;

      try {
        await updateKalyanResult(selectedResult.id, { closePanna: updateClosePanna, jodi: newJodi }, marketSlug);
        toast({ title: "Result Updated", description: "Close panna and jodi have been added." });
        setUpdateResultDialogOpen(false);
        setSelectedResult(null);
        setUpdateClosePanna("");
      } catch (error: any) {
         toast({ variant: "destructive", title: "Update Failed", description: error.message });
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
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
                <CardTitle>Results for {marketName}</CardTitle>
                <CardDescription>View and manage game results.</CardDescription>
            </div>
            <Dialog open={isAddOpenResultDialogOpen} onOpenChange={setAddOpenResultDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Open Result</Button>
              </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Open Result for {marketName}</DialogTitle>
                  </DialogHeader>
                   <form className="space-y-4" onSubmit={handleSubmitOpenResult}>
                      <div>
                          <Label htmlFor="date">Date</Label>
                          <Input name="date" id="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                      </div>
                      <div>
                          <Label htmlFor="open-panna">Open Panna</Label>
                          <Input name="openPanna" id="open-panna" placeholder="e.g., 123" value={openPanna} onChange={(e) => setOpenPanna(e.target.value)} />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full">Add Open Result</Button>
                      </DialogFooter>
                  </form>
                </DialogContent>
            </Dialog>
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
                    ) : sortedResults.length ? sortedResults.map((result) => (
                    <TableRow key={result.id}>
                        <TableCell>{new Date(result.date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell className="font-mono">{result.openPanna}</TableCell>
                        <TableCell className="font-bold text-primary font-mono">{result.jodi || '--'}</TableCell>
                        <TableCell className="font-mono">{result.closePanna || '--'}</TableCell>
                        <TableCell className="flex gap-2">
                          {!result.closePanna ? (
                            <Button variant="outline" size="sm" onClick={() => {
                                setSelectedResult(result);
                                setUpdateResultDialogOpen(true);
                            }}>Add Close</Button>
                          ) : (
                            <Button variant="outline" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                          )}
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
                 sortedResults.length ? sortedResults.map((result) => (
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
                                <span className="text-2xl font-bold tracking-wider">{result.jodi || '--'}</span>
                                <span className="text-[10px] font-medium">Jodi</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground">Close</span>
                                <span className="text-lg font-bold">{result.closePanna || '--'}</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            {!result.closePanna ? (
                                <Button variant="outline" size="sm" onClick={() => {
                                setSelectedResult(result);
                                setUpdateResultDialogOpen(true);
                                }}>Add Close</Button>
                            ) : (
                                <Button variant="outline" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                            )}
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

       <Dialog open={isUpdateResultDialogOpen} onOpenChange={setUpdateResultDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add Close Panna for {selectedResult?.marketName}</DialogTitle>
                <DialogDescription>Date: {selectedResult ? new Date(selectedResult.date).toLocaleDateString('en-GB') : ''}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateResult}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="update-open-panna" className="text-right">Open Panna</Label>
                      <Input id="update-open-panna" value={selectedResult?.openPanna || ''} disabled className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="update-close-panna" className="text-right">Close Panna</Label>
                      <Input id="update-close-panna" value={updateClosePanna} onChange={(e) => setUpdateClosePanna(e.target.value)} className="col-span-3" placeholder="e.g. 456" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="update-jodi" className="text-right">Jodi</Label>
                      <Input id="update-jodi" value={selectedResult ? `${getPannaSum(selectedResult.openPanna)}${getPannaSum(updateClosePanna)}` : ''} disabled className="col-span-3" />
                    </div>
                </div>
                 <DialogFooter>
                    <Button type="submit">Update Result</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    