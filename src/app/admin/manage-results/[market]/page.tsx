
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Edit, Trash, CalendarOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
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
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


type KalyanResult = {
  id: string;
  date: string;
  marketName: string;
  openPanna: string;
  jodi: string;
  closePanna: string;
};

const RESULTS_PER_PAGE = 30;

const getPannaSum = (panna: string) => {
    if (!panna || panna.length !== 3 || !/^\d+$/.test(panna)) return '';
    return String(panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10);
};


export default function EnterResultsPage() {
    const params = useParams();
    const marketSlug = params.market as string;
    
    const firestore = useFirestore();

    const marketName = marketSlug ? marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "";

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || !marketName) return null;
        const yearAgo = new Date();
        yearAgo.setDate(yearAgo.getDate() - 365);
        const dateString = `${yearAgo.getFullYear()}-${String(yearAgo.getMonth() + 1).padStart(2, '0')}-${String(yearAgo.getDate()).padStart(2, '0')}`;

        return query(
          collection(firestore, 'kalyan_results'),
          where('marketName', '==', marketName),
          where('date', '>=', dateString),
          orderBy('date', 'desc')
        );
    }, [firestore, marketName]);

    const { data: results, isLoading, error } = useCollection<KalyanResult>(resultsQuery, { skip: !firestore || !marketName });

    const [openPanna, setOpenPanna] = useState('');
    const [isAddOpenResultDialogOpen, setAddOpenResultDialogOpen] = useState(false);
    const [isUpdateResultDialogOpen, setUpdateResultDialogOpen] = useState(false);
    const [isHolidayDialogOpen, setHolidayDialogOpen] = useState(false);
    const [selectedResult, setSelectedResult] = useState<KalyanResult | null>(null);
    const [updateClosePanna, setUpdateClosePanna] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const { paginatedResults, totalPages } = useMemo(() => {
      if (!results) return { paginatedResults: [], totalPages: 0 };
      const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
      const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
      const endIndex = startIndex + RESULTS_PER_PAGE;
      const paginatedResults = results.slice(startIndex, endIndex);
      return { paginatedResults, totalPages };
    }, [results, currentPage]);


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
            });
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
        await updateKalyanResult(selectedResult.id, { closePanna: updateClosePanna, jodi: newJodi });
        toast({ title: "Result Updated", description: "Close panna and jodi have been added." });
        setUpdateResultDialogOpen(false);
        setSelectedResult(null);
        setUpdateClosePanna("");
      } catch (error: any) {
         toast({ variant: "destructive", title: "Update Failed", description: error.message });
      }
    }

     const handleMarkAsHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const date = formData.get("holiday-date") as string;
        
        if (!date) {
            toast({ variant: "destructive", title: "Missing Date", description: "Please select a date." });
            return;
        }

        try {
            await createKalyanResult({
                date,
                marketName: marketName.trim(),
                openPanna: "H",
                closePanna: "O",
                jodi: "L"
            });
            toast({
                title: "Holiday Marked",
                description: `${new Date(date).toLocaleDateString('en-GB')} has been marked as a holiday for ${marketName}.`,
            });
            form.reset();
            setHolidayDialogOpen(false);
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Failed to Mark Holiday",
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

    if (!marketSlug) {
      return <div>Loading market...</div>
    }

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-4">
            <div>
                <CardTitle>Results for {marketName}</CardTitle>
                <CardDescription>View and manage game results for the last year.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Dialog open={isHolidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
                    <DialogTrigger asChild><Button variant="outline" className="w-full sm:w-auto"><CalendarOff className="mr-2 h-4 w-4" />Mark as Holiday</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mark Holiday for {marketName}</DialogTitle>
                        </DialogHeader>
                        <form className="space-y-4" onSubmit={handleMarkAsHoliday}>
                            <div>
                                <Label htmlFor="holiday-date">Date</Label>
                                <Input name="holiday-date" id="holiday-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full">Mark as Holiday</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <Dialog open={isAddOpenResultDialogOpen} onOpenChange={setAddOpenResultDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">Add Open Result</Button>
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
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
             {/* Desktop Table */}
             <div className="hidden md:block rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Open Panna</TableHead>
                    <TableHead className="text-center">Jodi</TableHead>
                    <TableHead className="text-center">Close Panna</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center p-4">
                               <Skeleton className="h-24 w-full" />
                            </TableCell>
                         </TableRow>
                    ) : error ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-red-500 py-4">{error.message}</TableCell>
                        </TableRow>
                    ) : paginatedResults && paginatedResults.length > 0 ? paginatedResults.map((result) => (
                    <TableRow key={result.id}>
                        <TableCell className="py-1">{new Date(result.date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell className="font-mono text-center py-1">{result.openPanna}</TableCell>
                        <TableCell className="font-bold text-primary font-mono text-center py-1">{result.jodi === 'L' ? <Badge variant="destructive">HOLIDAY</Badge> : result.jodi || '--'}</TableCell>
                        <TableCell className="font-mono text-center py-1">{result.closePanna || '--'}</TableCell>
                        <TableCell className="py-1">
                          <div className="flex gap-2 justify-center">
                          {result.jodi === 'L' ? (
                              <Button variant="outline" size="xs" disabled><Edit className="h-4 w-4" /></Button>
                          ) : (
                              <Button 
                                  variant="outline" 
                                  size="xs" 
                                  onClick={() => {
                                      setSelectedResult(result);
                                      setUpdateClosePanna(result.closePanna || ""); // Pre-fill
                                      setUpdateResultDialogOpen(true);
                                  }}
                              >
                                  <Edit className="h-4 w-4" />
                              </Button>
                          )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="xs"><Trash className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the result for {new Date(result.date).toLocaleDateString('en-GB')}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(result.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                        </TableCell>
                    </TableRow>
                    )) : (
                        <TableRow>
                           <TableCell colSpan={5} className="text-center py-4">No results found for this market.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
             {/* Mobile List */}
             <div className="grid gap-4 md:hidden">
              {isLoading ? (
                <div className="p-4"><Skeleton className="h-24 w-full" /></div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error.message}</div>
              ) : paginatedResults && paginatedResults.length > 0 ? (
                paginatedResults.map((result) => (
                  <Card key={result.id} className="p-4">
                     <div className="flex justify-between items-start">
                          <div>
                              <p className="font-semibold">{new Date(result.date).toLocaleDateString('en-GB')}</p>
                              <p className="text-xs text-muted-foreground">{marketName}</p>
                          </div>
                          {result.jodi === 'L' ? <Badge variant="destructive">HOLIDAY</Badge> : (
                            <div className="text-right">
                                <p className="font-bold text-lg text-primary">{result.jodi || '--'}</p>
                            </div>
                          )}
                      </div>
                      <div className={cn("grid grid-cols-2 gap-2 mt-2 pt-2 border-t", result.jodi === 'L' && 'hidden')}>
                          <div className="text-xs">
                              <p className="text-muted-foreground">Open</p>
                              <p className="font-mono font-medium">{result.openPanna || '---'}</p>
                          </div>
                           <div className="text-xs text-right">
                              <p className="text-muted-foreground">Close</p>
                              <p className="font-mono font-medium">{result.closePanna || '---'}</p>
                          </div>
                      </div>
                       <div className="flex gap-2 justify-end mt-4 pt-2 border-t">
                          {result.jodi === 'L' ? (
                               <Button variant="outline" size="xs" disabled><Edit className="h-4 w-4 mr-1"/> Edit</Button>
                          ) : (
                               <Button 
                                  variant="outline" 
                                  size="xs" 
                                  onClick={() => {
                                      setSelectedResult(result);
                                      setUpdateClosePanna(result.closePanna || "");
                                      setUpdateResultDialogOpen(true);
                                  }}
                              >
                                  <Edit className="h-4 w-4 mr-1"/> {result.closePanna ? 'Update' : 'Add Close'}
                              </Button>
                          )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="xs"><Trash className="h-4 w-4 mr-1" /> Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the result for {new Date(result.date).toLocaleDateString('en-GB')}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(result.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No results found for this market.
                </div>
              )}
            </div>
          </CardContent>
           {totalPages > 1 && (
             <CardFooter className="flex justify-end items-center gap-4 border-t pt-4">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </CardFooter>
          )}
        </Card>
      </div>

       <Dialog open={isUpdateResultDialogOpen} onOpenChange={setUpdateResultDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedResult?.closePanna ? 'Update' : 'Add Close'} Result for {selectedResult?.marketName}</DialogTitle>
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
                    <Button type="submit">{selectedResult?.closePanna ? 'Update' : 'Add'} Result</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
