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
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Edit, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { updateBet, deleteBet } from "@/app/actions/bet-actions";

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

export default function BetLedgerPage() {
  const firestore = useFirestore();
  const [currentPage, setCurrentPage] = useState(1);
  const [date, setDate] = useState<Date>(new Date());
  
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);

  const betsQuery = useMemoFirebase(
    () => firestore 
            ? query(
                collection(firestore, 'kalyan_bets'),
                orderBy('createdAt', 'desc')
              )
            : null,
    [firestore]
  );
  const { data: allBets, isLoading } = useCollection<Bet>(betsQuery, { skip: !firestore });
  
  const betsForSelectedDate = useMemo(() => {
    if (!allBets) return [];
    const interval = { start: startOfDay(date), end: endOfDay(date) };
    return allBets.filter(bet => 
        bet.createdAt && isWithinInterval(bet.createdAt.toDate(), interval)
    );
  }, [allBets, date]);


  const totalPages = Math.ceil((betsForSelectedDate?.length || 0) / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    if (!betsForSelectedDate) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return betsForSelectedDate.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [betsForSelectedDate, currentPage]);

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


  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Bet Ledger</CardTitle>
            <CardDescription className="text-white/80">A complete ledger of all bets placed for the selected date.</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal bg-black/20 border-white/20 hover:bg-black/30 text-white hover:text-white",
                  !date && "text-white/80"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(day) => setDate(day || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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
                {!isLoading && paginatedData.map((bet) => (
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
                                <Button variant="outline" size="icon" className="h-7 w-7 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => handleEditClick(bet)}>
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
                ))}
                </TableBody>
            </Table>
            </div>
             {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
            {isLoading && <p className="text-center text-white/80 py-8">Loading bets...</p>}
            {!isLoading && paginatedData.map((bet) => (
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
                    <Button variant="outline" size="sm" className="bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => handleEditClick(bet)}>
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
            ))}
            </div>
             {!isLoading && paginatedData.length === 0 && (
                <p className="text-center py-8 text-white/80">No bets found for the selected date.</p>
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
