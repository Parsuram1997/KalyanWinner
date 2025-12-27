
"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, Timestamp, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Filter, Edit, Trash2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { updateBet, deleteBet } from "@/app/actions/bet-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Bet = {
    id: string;
    userId: string;
    userName: string;
    market: string;
    gameType: string;
    number: string;
    amount: number;
    session: 'Open' | 'Close' | 'Jodi';
    status: "Placed" | "Won" | "Lost";
    createdAt: Timestamp;
};

type Result = {
    id: string;
    marketName: string;
    date: string;
    openPanna?: string;
    closePanna?: string;
    jodi?: string;
};

const ITEMS_PER_PAGE = 50;

const getStatusClasses = (status: Bet['status']) => {
    switch (status) {
        case 'Won':
            return 'bg-green-400/20 text-green-300 border border-green-400';
        case 'Lost':
            return 'bg-red-400/20 text-red-300 border border-red-400';
        default:
            return 'bg-blue-400/20 text-blue-300 border border-blue-400';
    }
}

const months = [
  { value: "0", label: "January" }, { value: "1", label: "February" }, { value: "2", label: "March" },
  { value: "3", label: "April" }, { value: "4", label: "May" }, { value: "5", label: "June" },
  { value: "6", label: "July" }, { value: "7", label: "August" }, { value: "8", label: "September" },
  { value: "9", label: "October" }, { value: "10", label: "November" }, { value: "11", label: "December" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());


export default function BetLedgerPage() {
  const firestore = useFirestore();
  const [currentPage, setCurrentPage] = useState(1);
  const [date, setDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);

  const [day, setDay] = useState<string | undefined>(() => date.getDate().toString());
  const [month, setMonth] = useState<string | undefined>(() => date.getMonth().toString());
  const [year, setYear] = useState<string | undefined>(() => date.getFullYear().toString());
  const [isPopoverOpen, setPopoverOpen] = useState(false);


  const betsQuery = useMemoFirebase(
    () => firestore 
            ? query(
                collection(firestore, 'kalyan_bets'),
                orderBy('createdAt', 'desc')
              )
            : null,
    [firestore]
  );
  const { data: allBets, isLoading: isBetsLoading } = useCollection<Bet>(betsQuery);
  
  const formattedDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  const resultsQuery = useMemoFirebase(
    () => firestore 
            ? query(
                collection(firestore, 'kalyan_results'),
                where('date', '==', formattedDate)
              )
            : null,
    [firestore, formattedDate]
  );
  const { data: resultsForSelectedDate, isLoading: isResultsLoading } = useCollection<Result>(resultsQuery);

  const resultsMap = useMemo(() => {
    if (!resultsForSelectedDate) return new Map<string, Result>();
    return new Map(resultsForSelectedDate.map(r => [r.marketName, r]));
  }, [resultsForSelectedDate]);


  const betsForSelectedDate = useMemo(() => {
    if (!allBets || !date) return [];
    const interval = { start: startOfDay(date), end: endOfDay(date) };
    return allBets.filter(bet => 
        bet.createdAt && isWithinInterval(bet.createdAt.toDate(), interval)
    );
  }, [allBets, date]);

  const filteredBets = useMemo(() => {
    if (!betsForSelectedDate) return [];
    if (!searchTerm) return betsForSelectedDate;

    const lowercasedTerm = searchTerm.toLowerCase();
    return betsForSelectedDate.filter(bet =>
        bet.userName.toLowerCase().includes(lowercasedTerm) ||
        bet.number.toLowerCase().includes(lowercasedTerm) ||
        bet.market.toLowerCase().includes(lowercasedTerm) ||
        bet.gameType.toLowerCase().includes(lowercasedTerm)
    );
  }, [betsForSelectedDate, searchTerm]);


  const totalPages = Math.ceil((filteredBets?.length || 0) / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    if (!filteredBets) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBets, currentPage]);

  const handleEditClick = (bet: Bet) => {
    setSelectedBet(bet);
    setEditDialogOpen(true);
  };
  
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBet) return;
    const formData = new FormData(e.currentTarget);
    const updatedNumber = formData.get("number") as string;
    const updatedAmount = parseFloat(formData.get("amount") as string);

    try {
        await updateBet(selectedBet.id, { number: updatedNumber, amount: updatedAmount });
        toast({ title: "Bet Updated Successfully" });
        setEditDialogOpen(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const handleDeleteBet = async (betId: string) => {
      try {
          await deleteBet(betId);
          toast({ title: "Bet Deleted Successfully" });
      } catch (error: any) {
          toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
      }
  };

  const isBetEditable = (bet: Bet) => {
      const result = resultsMap.get(bet.market);
      if (!result) return true; // No result for this market today, so editable.

      if (bet.session === 'Open') {
          return !result.openPanna; // Editable if open panna is not declared.
      }
      if (bet.session === 'Close') {
          return !result.closePanna; // Editable if close panna is not declared.
      }
      if (bet.session === 'Jodi') {
          // Jodi, Full Sangam etc. depend on the final result.
          return !result.closePanna;
      }
      return true; // Default to editable if session is not matched
  };

  const isLoading = isBetsLoading || isResultsLoading;

  const handleFilter = () => {
    if (day && month && year) {
        const newDate = new Date(parseInt(year), parseInt(month), parseInt(day));
        setDate(newDate);
        setCurrentPage(1);
    }
    setPopoverOpen(false);
  }

  const handleClear = () => {
    setDate(new Date());
    setDay(new Date().getDate().toString());
    setMonth(new Date().getMonth().toString());
    setYear(new Date().getFullYear().toString());
    setCurrentPage(1);
    setPopoverOpen(false);
  }


  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Bet Ledger</CardTitle>
            <CardDescription className="text-white/80">A complete ledger of all bets placed for the selected date.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search..."
                className="pl-8 bg-black/20 border-white/20 text-white sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                 <Button variant="outline" className="w-full sm:w-auto bg-black/20 text-white hover:bg-white/10 border-white/20">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter by Date
                    {date && <span className="text-xs font-semibold ml-2 text-yellow-300">{format(date, "dd/MM/yy")}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-screen max-w-xs sm:w-80">
                  <div className="grid gap-4">
                      <div className="space-y-2">
                          <h4 className="font-medium leading-none">Select Date</h4>
                          <p className="text-sm text-muted-foreground">
                          Select a day, month, and year to filter bets.
                          </p>
                      </div>
                      <div className="grid gap-2">
                          <div className="grid grid-cols-3 items-center gap-2">
                              <Select onValueChange={setDay} value={day}>
                                  <SelectTrigger className="w-full"><SelectValue placeholder="Day" /></SelectTrigger>
                                  <SelectContent>{days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                              <Select onValueChange={setMonth} value={month}>
                                  <SelectTrigger className="w-full"><SelectValue placeholder="Month" /></SelectTrigger>
                                  <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                              </Select>
                              <Select onValueChange={setYear} value={year}>
                                  <SelectTrigger className="w-full"><SelectValue placeholder="Year" /></SelectTrigger>
                                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                              </Select>
                          </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <Button onClick={handleFilter} className="w-full">Go</Button>
                              <Button onClick={handleClear} variant="secondary" className="w-full">Clear</Button>
                          </div>
                      </div>
                  </div>
              </PopoverContent>
          </Popover>
          </div>
        </CardHeader>
        <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border border-white/20 text-sm">
            <Table>
                <TableHeader className="border-b border-white/20">
                <TableRow>
                    <TableHead className="py-2 text-white">User</TableHead>
                    <TableHead className="py-2 text-white">Market & Game</TableHead>
                    <TableHead className="py-2 text-white">Number</TableHead>
                    <TableHead className="py-2 text-white">Session</TableHead>
                    <TableHead className="py-2 text-white">Status</TableHead>
                    <TableHead className="py-2 text-right text-white">Amount</TableHead>
                    <TableHead className="py-2 text-center text-white">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="border-white/20">
                        <TableCell colSpan={7} className="py-2"><Skeleton className="h-6 w-full bg-white/20" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && paginatedData.map((bet) => {
                    const editable = isBetEditable(bet);
                    return (
                        <TableRow key={bet.id} className="border-white/20">
                            <TableCell className="py-2 font-medium">{bet.userName}</TableCell>
                            <TableCell className="py-2">
                                <div>{bet.market}</div>
                                <div className="text-white/80">{bet.gameType}</div>
                            </TableCell>
                            <TableCell className="font-mono py-2">{bet.number}</TableCell>
                            <TableCell className="py-2">{bet.session}</TableCell>
                            <TableCell className="py-2">
                                <Badge className={cn('text-xs', getStatusClasses(bet.status))}>{bet.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold py-2">
                                ₹{bet.amount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="py-2 text-center">
                                <div className="flex gap-2 justify-center">
                                    <Button variant="outline" size="icon" className="h-7 w-7 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => handleEditClick(bet)} disabled={!editable}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-7 w-7">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete this bet.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteBet(bet.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                )}
                </TableBody>
            </Table>
            </div>
             {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
            {isLoading && <p className="text-center text-white/80 py-8">Loading bets...</p>}
            {!isLoading && paginatedData.map((bet) => {
                 const editable = isBetEditable(bet);
                 return (
                    <Card key={bet.id} className="p-3 text-sm bg-black/20 border-white/20">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="font-semibold">{bet.userName}</p>
                            <p className="text-xs text-white/80">{bet.createdAt.toDate().toLocaleString()}</p>
                        </div>
                        <Badge className={cn('text-xs', getStatusClasses(bet.status))}>{bet.status}</Badge>
                    </div>
                    <div className="space-y-2 border-t border-white/20 pt-3 text-xs">
                        <div className="flex justify-between">
                            <span className="text-white/80">Market:</span>
                            <span className="font-medium">{bet.market}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/80">Game:</span>
                            <span className="font-medium">{bet.gameType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/80">Number:</span>
                            <span className="font-mono font-bold">{bet.number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/80">Session:</span>
                            <span className="font-medium">{bet.session}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/80">Amount:</span>
                            <span className="font-mono font-bold">₹{bet.amount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <CardFooter className="p-0 pt-3 mt-3 border-t border-white/20 flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => handleEditClick(bet)} disabled={!editable}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete this bet.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteBet(bet.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                    </Card>
                 )}
            )}
            </div>
             {!isLoading && paginatedData.length === 0 && (
                <p className="text-center py-8 text-white/80">No bets found for the selected date and filter.</p>
            )}
        </CardContent>
         {totalPages > 1 && (
             <CardFooter className="flex justify-end items-center gap-4 border-t border-white/20 pt-4">
                <span className="text-sm text-white/80">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent text-white hover:bg-white/10 hover:text-white"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                     className="bg-transparent text-white hover:bg-white/10 hover:text-white"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </CardFooter>
          )}
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Bet</DialogTitle>
                    <DialogDescription>
                        Modify the bet details. This action is final.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="number">Number</Label>
                        <Input id="number" name="number" defaultValue={selectedBet?.number} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" name="amount" type="number" defaultValue={selectedBet?.amount} />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
