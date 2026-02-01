
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Edit, Trash, CalendarOff, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { createKalyanResult, deleteKalyanResult, updateKalyanResult } from "@/app/actions/result-actions";
import Link from "next/link";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";


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

// Helper to parse date string and validate it
const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.length !== 10) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const [day, month, year] = parts.map(p => parseInt(p, 10));
    if (isNaN(day) || isNaN(month) || isNaN(year) || year.toString().length !== 4) return null;
    
    // JS month is 0-indexed, so subtract 1
    const date = new Date(year, month - 1, day);
    
    // Final validation to check if the constructed date is valid (e.g., handles 31/02/2024)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
}


export default function EnterResultsPage() {
    const params = useParams();
    const marketSlug = Array.isArray(params.market) ? params.market[0] : params.market as string;
    
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

    const { data: results, isLoading, error } = useCollection<KalyanResult>(resultsQuery);

    const [openPanna, setOpenPanna] = useState('');
    const [isAddOpenResultDialogOpen, setAddOpenResultDialogOpen] = useState(false);
    const [isUpdateResultDialogOpen, setUpdateResultDialogOpen] = useState(false);
    const [isHolidayDialogOpen, setHolidayDialogOpen] = useState(false);
    const [selectedResult, setSelectedResult] = useState<KalyanResult | null>(null);
    const [updateClosePanna, setUpdateClosePanna] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    
    // New state for the single date input
    const [dateInput, setDateInput] = useState(() => format(new Date(), 'dd/MM/yyyy'));

    const { paginatedResults, totalPages } = useMemo(() => {
      if (!results) return { paginatedResults: [], totalPages: 0 };
      const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
      const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
      const endIndex = startIndex + RESULTS_PER_PAGE;
      const paginatedResults = results.slice(startIndex, endIndex);
      return { paginatedResults, totalPages };
    }, [results, currentPage]);
    
    // Handler for the auto-formatting date input
    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, ''); // Remove all non-digits
        let formattedValue = '';
        if (rawValue.length > 0) {
            formattedValue = rawValue.slice(0, 2);
        }
        if (rawValue.length > 2) {
            formattedValue += '/' + rawValue.slice(2, 4);
        }
        if (rawValue.length > 4) {
            formattedValue += '/' + rawValue.slice(4, 8);
        }
        setDateInput(formattedValue);
    };


    const handleSubmitOpenResult = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const dateObj = parseDateString(dateInput);

        if (!dateObj || !openPanna) {
            toast({ variant: "destructive", title: "Invalid Fields", description: "Please enter a valid date (DD/MM/YYYY) and Open Panna." });
            return;
        }

        const formattedDate = format(dateObj, "yyyy-MM-dd");

        try {
            await createKalyanResult({
                date: formattedDate,
                marketName: marketName.trim(),
                openPanna,
            });
            toast({
                title: "Open Result Added",
                description: `The open panna for ${marketName} has been added.`,
            });
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
        const dateObj = parseDateString(dateInput);
        
        if (!dateObj) {
            toast({ variant: "destructive", title: "Invalid Date", description: "Please enter a valid date in DD/MM/YYYY format." });
            return;
        }

        const formattedDate = format(dateObj, "yyyy-MM-dd");

        try {
            await createKalyanResult({
                date: formattedDate,
                marketName: marketName.trim(),
                openPanna: "H",
                closePanna: "O",
                jodi: "L"
            });
            toast({
                title: "Holiday Marked",
                description: `${formattedDate} has been marked as a holiday for ${marketName}.`,
            });
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
      return <div className="text-white">Loading market...</div>
    }

  return (
    <div className="flex flex-col gap-6 text-white">
        <Button asChild variant="ghost" className="hover:bg-white/10 w-fit text-white">
             <Link href="/admin/manage-results">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Markets
            </Link>
        </Button>
      
        <Card className="bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900 border-white/10">
          <CardHeader className="flex flex-col gap-4">
            <div>
                <CardTitle className="text-white">Results for {marketName}</CardTitle>
                <CardDescription className="text-white/70">View and manage game results for the last year.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Dialog open={isHolidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto bg-black/30 border-white/20 hover:bg-black/40 text-white">
                            <CalendarOff className="mr-2 h-4 w-4" />Mark as Holiday
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-950 text-white border-gray-800">
                        <DialogHeader>
                            <DialogTitle>Mark Holiday for {marketName}</DialogTitle>
                        </DialogHeader>
                        <form className="space-y-4" onSubmit={handleMarkAsHoliday}>
                             <div className="space-y-2">
                                <Label htmlFor="holiday-date">Date</Label>
                                <Input
                                    id="holiday-date"
                                    placeholder="DD/MM/YYYY"
                                    value={dateInput}
                                    onChange={handleDateInputChange}
                                    className="bg-gray-900 border-gray-700"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Mark as Holiday</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <Dialog open={isAddOpenResultDialogOpen} onOpenChange={setAddOpenResultDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">Add Open Result</Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-950 text-white border-gray-800">
                    <DialogHeader>
                        <DialogTitle>Add Open Result for {marketName}</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleSubmitOpenResult}>
                         <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                             <Input
                                id="date"
                                placeholder="DD/MM/YYYY"
                                value={dateInput}
                                onChange={handleDateInputChange}
                                className="bg-gray-900 border-gray-700"
                            />
                        </div>
                        <div>
                            <Label htmlFor="open-panna">Open Panna</Label>
                            <Input name="openPanna" id="open-panna" placeholder="e.g., 123" value={openPanna} onChange={(e) => setOpenPanna(e.target.value)} className="bg-gray-900 border-gray-700"/>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Add Open Result</Button>
                        </DialogFooter>
                    </form>
                    </DialogContent>
                </Dialog>
            </div>
          </CardHeader>
          <CardContent>
             {/* Desktop Table */}
            <div className="hidden md:block rounded-md border border-white/20 text-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b-white/20 hover:bg-black/20">
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-center text-white">Open</TableHead>
                            <TableHead className="text-center text-white">Jodi</TableHead>
                            <TableHead className="text-center text-white">Close</TableHead>
                            <TableHead className="text-center text-white">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow className="border-b-white/20">
                                <TableCell colSpan={5} className="p-4">
                                    <Skeleton className="h-24 w-full bg-white/10" />
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow className="border-b-white/20">
                                <TableCell colSpan={5} className="text-center text-red-400 py-4">{error.message}</TableCell>
                            </TableRow>
                        ) : paginatedResults && paginatedResults.length > 0 ? paginatedResults.map((result) => (
                            <TableRow key={result.id} className="border-b-white/20 hover:bg-black/20 text-xs">
                                <TableCell className="py-2 whitespace-nowrap">{new Date(result.date).toLocaleDateString('en-GB')}</TableCell>
                                <TableCell className="font-mono text-center py-2">{result.openPanna}</TableCell>
                                <TableCell className="font-bold text-base text-white font-mono text-center py-2">{result.jodi === 'L' ? <Badge variant="destructive">HOLIDAY</Badge> : result.jodi || '--'}</TableCell>
                                <TableCell className="font-mono text-center py-2">{result.closePanna || '--'}</TableCell>
                                <TableCell className="py-2">
                                    <div className="flex gap-1 justify-center">
                                        {result.jodi === 'L' ? (
                                            <Button variant="outline" size="icon" disabled className="bg-transparent cursor-not-allowed h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                        ) : (
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="bg-transparent hover:bg-white/10 h-8 w-8"
                                                onClick={() => {
                                                    setSelectedResult(result);
                                                    setUpdateClosePanna(result.closePanna || "");
                                                    setUpdateResultDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon" className="h-8 w-8"><Trash className="h-4 w-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-gray-950 text-white border-gray-800">
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the result for {new Date(result.date).toLocaleDateString('en-GB')}.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(result.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow className="border-b-white/20">
                                <TableCell colSpan={5} className="text-center py-8 text-white/70">No results found for this market.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile List */}
            <div className="grid gap-3 md:hidden">
                {isLoading ? (
                    <div className="p-3"><Skeleton className="h-20 w-full bg-white/10" /></div>
                ) : error ? (
                    <div className="p-3 text-center text-red-400">{error.message}</div>
                ) : paginatedResults && paginatedResults.length > 0 ? (
                    paginatedResults.map((result) => (
                    <Card key={result.id} className="p-3 bg-black/30 border-white/20 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-sm">{new Date(result.date).toLocaleDateString('en-GB')}</p>
                                <p className="text-xs text-white/70">{marketName}</p>
                            </div>
                            {result.jodi === 'L' ? <Badge variant="destructive">HOLIDAY</Badge> : (
                                <div className="text-right">
                                    <p className="font-bold text-base text-white">{result.jodi || '--'}</p>
                                </div>
                            )}
                        </div>
                        <div className={cn("grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/20", result.jodi === 'L' && 'hidden')}>
                            <div className="text-xs">
                                <p className="text-white/70">Open</p>
                                <p className="font-mono font-medium text-sm">{result.openPanna || '---'}</p>
                            </div>
                            <div className="text-xs text-right">
                                <p className="text-white/70">Close</p>
                                <p className="font-mono font-medium text-sm">{result.closePanna || '---'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-3 pt-2 border-t border-white/20">
                            {result.jodi === 'L' ? (
                                <Button variant="outline" size="sm" disabled className="bg-transparent text-xs"><Edit className="h-3 w-3 mr-1"/> Edit</Button>
                            ) : (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-transparent hover:bg-white/10 text-xs text-white"
                                    onClick={() => {
                                        setSelectedResult(result);
                                        setUpdateClosePanna(result.closePanna || "");
                                        setUpdateResultDialogOpen(true);
                                    }}
                                >
                                    <Edit className="h-3 w-3 mr-1"/> {result.closePanna ? 'Update' : 'Add Close'}
                                </Button>
                            )}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="text-xs"><Trash className="h-3 w-3 mr-1" /> Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gray-950 text-white border-gray-800">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the result for {new Date(result.date).toLocaleDateString('en-GB')}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(result.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </Card>
                    ))
                ) : (
                    <div className="text-center py-8 text-white/70">
                    No results found for this market.
                    </div>
                )}
            </div>
          </CardContent>
           {totalPages > 1 && (
             <CardFooter className="flex justify-end items-center gap-2 border-t border-white/20 pt-4 px-3">
                <span className="text-xs text-white/70">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent hover:bg-white/10 text-xs text-white"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                     className="bg-transparent hover:bg-white/10 text-xs text-white"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </CardFooter>
          )}
        </Card>

       <Dialog open={isUpdateResultDialogOpen} onOpenChange={setUpdateResultDialogOpen}>
        <DialogContent className="bg-gray-950 text-white border-gray-800">
            <DialogHeader>
                <DialogTitle>{selectedResult?.closePanna ? 'Update' : 'Add Close'} Result for {selectedResult?.marketName}</DialogTitle>
                <DialogDescription>Date: {selectedResult ? new Date(selectedResult.date).toLocaleDateString('en-GB') : ''}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateResult}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="update-open-panna" className="text-right">Open Panna</Label>
                      <Input id="update-open-panna" value={selectedResult?.openPanna || ''} disabled className="col-span-3 bg-gray-800 border-gray-700" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="update-close-panna" className="text-right">Close Panna</Label>
                      <Input id="update-close-panna" value={updateClosePanna} onChange={(e) => setUpdateClosePanna(e.target.value)} className="col-span-3 bg-gray-800 border-gray-700" placeholder="e.g. 456" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="update-jodi" className="text-right">Jodi</Label>
                      <Input id="update-jodi" value={selectedResult ? `${getPannaSum(selectedResult.openPanna)}${getPannaSum(updateClosePanna)}` : ''} disabled className="col-span-3 bg-gray-800 border-gray-700" />
                    </div>
                </div>
                 <DialogFooter>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{selectedResult?.closePanna ? 'Update' : 'Add'} Result</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
