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

const getStatusVariant = (status: Bet['status']) => {
    switch (status) {
        case 'Won':
            return 'success';
        case 'Lost':
            return 'destructive';
        default:
            return 'outline';
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
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Bet Ledger</CardTitle>
            <CardDescription>A complete ledger of all bets placed for the selected date.</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
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
            <div className="hidden md:block rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="py-1">User</TableHead>
                    <TableHead className="py-1">Market & Game</TableHead>
                    <TableHead className="py-1">Number</TableHead>
                    <TableHead className="py-1">Session</TableHead>
                    <TableHead className="py-1">Status</TableHead>
                    <TableHead className="py-1 text-right">Amount</TableHead>
                    <TableHead className="py-1 text-center">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={7} className="py-1"><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && paginatedData.map((bet) => (
                    <TableRow key={bet.id}>
                        <TableCell className="text-xs py-1 font-medium">{bet.userName}</TableCell>
                        <TableCell className="py-1 text-xs">
                            <div>{bet.market}</div>
                            <div className="text-muted-foreground">{bet.gameType}</div>
                        </TableCell>
                        <TableCell className="font-mono py-1 text-xs">{bet.number}</TableCell>
                        <TableCell className="py-1 text-xs">{bet.session}</TableCell>
                        <TableCell className="py-1 text-xs">
                            <Badge variant={getStatusVariant(bet.status)}>{bet.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold py-1 text-xs">
                            ₹{bet.amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="py-1 text-center">
                            <div className="flex gap-2 justify-center">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditClick(bet)}>
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
            {isLoading && <p className="text-center text-muted-foreground">Loading bets...</p>}
            {!isLoading && paginatedData.map((bet) => (
                <Card key={bet.id} className="p-3 text-sm">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="font-semibold">{bet.userName}</p>
                        <p className="text-xs text-muted-foreground">{bet.createdAt.toDate().toLocaleString()}</p>
                    </div>
                     <Badge variant={getStatusVariant(bet.status)}>{bet.status}</Badge>
                </div>
                <div className="space-y-2 border-t pt-3 text-xs">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Market:</span>
                        <span className="font-medium">{bet.market}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Game:</span>
                        <span className="font-medium">{bet.gameType}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Number:</span>
                        <span className="font-mono font-bold">{bet.number}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Session:</span>
                        <span className="font-medium">{bet.session}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-mono font-bold">₹{bet.amount.toLocaleString('en-IN')}</span>
                     </div>
                </div>
                <CardFooter className="p-0 pt-3 mt-3 border-t flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(bet)}>
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
                <p className="text-center py-8 text-muted-foreground">No bets found for the selected date.</p>
            )}
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
