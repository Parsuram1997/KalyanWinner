
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Wallet, Phone, MapPin, Map, Lock, Unlock, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateUserStatus } from "@/app/actions/user-actions";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const ITEMS_PER_PAGE = 50;


const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Completed':
        case 'Approved':
            return 'secondary';
        case 'Pending':
            return 'default';
        case 'Rejected':
            return 'warning';
        case 'Won':
             return 'success';
        case 'Lost':
            return 'destructive';
        default:
            return 'outline';
    }
}


export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.userId as string; 
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const [betCurrentPage, setBetCurrentPage] = useState(1);
  const [txnCurrentPage, setTxnCurrentPage] = useState(1);
  
  const userQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'users'), where('customId', '==', userId));
  }, [firestore, userId]);
  
  const { data: users, isLoading: isUserQueryLoading } = useCollection<any>(userQuery);

  const userDocId = users?.[0]?.id;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !userDocId) return null;
    return doc(firestore, "users", userDocId);
  }, [firestore, userDocId]);

  const { data: user, isLoading: isUserLoading } = useDoc<any>(userRef);

  const betsQuery = useMemoFirebase(() => {
      if (!firestore || !userDocId) return null;
      return query(collection(firestore, "kalyan_bets"), where("userId", "==", userDocId));
  }, [firestore, userDocId]);
  
  const { data: userBets, isLoading: areBetsLoading } = useCollection<any>(betsQuery);

  const txnsQuery = useMemoFirebase(() => {
    if (!firestore || !userDocId) return null;
    return query(
      collection(firestore, "transactions"), 
      where("userId", "==", userDocId),
      where('type', 'in', ['Deposit', 'Withdrawal']),
      orderBy("date", "desc")
    );
  }, [firestore, userDocId]);

  const { data: userTxns, isLoading: areTxnsLoading } = useCollection<any>(txnsQuery);

  const sortedBets = useMemo(() => {
    if (!userBets) return [];
    return [...userBets].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  }, [userBets]);

  const { paginatedBets, totalBetPages } = useMemo(() => {
    if (!sortedBets) return { paginatedBets: [], totalBetPages: 0 };
    const totalPages = Math.ceil(sortedBets.length / ITEMS_PER_PAGE);
    const startIndex = (betCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return { paginatedBets: sortedBets.slice(startIndex, endIndex), totalBetPages: totalPages };
  }, [sortedBets, betCurrentPage]);

  const { paginatedTxns, totalTxnPages } = useMemo(() => {
    if (!userTxns) return { paginatedTxns: [], totalTxnPages: 0 };
    const totalPages = Math.ceil(userTxns.length / ITEMS_PER_PAGE);
    const startIndex = (txnCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return { paginatedTxns: userTxns.slice(startIndex, endIndex), totalTxnPages: totalPages };
  }, [userTxns, txnCurrentPage]);
  
  const netProfitLoss = useMemo(() => {
    if (!userBets) return 0;
    
    const totalWinnings = userBets
      .filter(bet => bet.status === 'Won')
      .reduce((sum, bet) => sum + (bet.winningAmount || 0), 0);

    const totalBetAmount = userBets.reduce((sum, bet) => sum + bet.amount, 0);

    return totalWinnings - totalBetAmount;
  }, [userBets]);


  const isLoading = isUserQueryLoading || isUserLoading || areBetsLoading || areTxnsLoading;
  
  const handleStatusChange = () => {
    if (!userDocId || !user) return;
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    startTransition(async () => {
        try {
            await updateUserStatus(userDocId, newStatus);
            toast({
                title: "Status Updated",
                description: `${user.name}'s status has been changed to ${newStatus}.`,
            });
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update user status.",
            });
        }
    });
  };

  if (isLoading) {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </CardContent>
                 <CardFooter className="border-t pt-4">
                    <Skeleton className="h-10 w-36" />
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }
  
  const totalBalance = (user.depositBalance || 0) + (user.winningBalance || 0);
  const isInactive = user.status === 'Inactive';

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6" />
              <span>{user.name}</span>
            </CardTitle>
            <CardDescription className="mt-1">User ID: {user.customId}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">{user.mobile}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">State</p>
              <p className="font-medium">{user.state}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Map className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">District</p>
              <p className="font-medium">{user.district}</p>
            </div>
          </div>
           <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Joined On</p>
              <p className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="font-medium">₹{totalBalance.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Deposit Balance</p>
              <p className="font-medium">₹{(user.depositBalance || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Winning Balance</p>
              <p className="font-medium">₹{(user.winningBalance || 0).toFixed(2)}</p>
            </div>
          </div>
         
           {netProfitLoss >= 0 ? (
            <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Total Profit</p>
                    <p className="font-medium text-green-600">₹{netProfitLoss.toFixed(2)}</p>
                </div>
            </div>
        ) : (
            <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Total Loss</p>
                    <p className="font-medium text-red-600">-₹{Math.abs(netProfitLoss).toFixed(2)}</p>
                </div>
            </div>
        )}

          <div className="flex items-center gap-3">
            <div className="w-5 h-5"></div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={user.status === "Active" ? "secondary" : "outline"}>
                {user.status}
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t flex justify-end pt-6">
             <Button 
                onClick={handleStatusChange}
                disabled={isPending}
                variant={isInactive ? "secondary" : "destructive"} 
            >
                {isInactive ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                {isPending ? 'Updating...' : isInactive ? 'Mark as Active' : 'Mark as Inactive'}
            </Button>
        </CardFooter>
      </Card>

       <Card>
        <Tabs defaultValue="bets">
            <CardHeader>
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bets">Bet History</TabsTrigger>
                    <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                </TabsList>
            </CardHeader>
            <TabsContent value="bets">
                <CardContent>
                    <div className="hidden md:block rounded-md border">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Market</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedBets && paginatedBets.length > 0 ? paginatedBets.map((bet) => (
                            <TableRow key={bet.id}>
                                <TableCell className="py-0">{new Date(bet.createdAt.toDate()).toLocaleDateString('en-GB')}</TableCell>
                                <TableCell className="py-0">{`${bet.gameType} (${bet.number})`}</TableCell>
                                <TableCell className="py-0">{bet.market}</TableCell>
                                <TableCell className="py-0">
                                <Badge variant={getStatusVariant(bet.status)}>{bet.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right py-0">-₹{bet.amount.toFixed(2)}</TableCell>
                            </TableRow>
                            )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No bets placed by this user yet.</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                     <div className="grid gap-4 md:hidden">
                        {!areBetsLoading && paginatedBets && paginatedBets.length > 0 ? paginatedBets.map((bet) => (
                        <Card key={bet.id} className="p-4 text-xs">
                            <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-semibold">{`${bet.gameType} (${bet.number})`}</p>
                                <p className="text-muted-foreground">{new Date(bet.createdAt.toDate()).toLocaleString('en-GB')}</p>
                            </div>
                            <Badge variant={getStatusVariant(bet.status)}>{bet.status}</Badge>
                            </div>
                            <div className="space-y-1 border-t pt-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Market:</span>
                                <span className="font-medium">{bet.market}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="font-medium">-₹{bet.amount.toFixed(2)}</span>
                            </div>
                            </div>
                        </Card>
                        )) : (
                        <p className="text-center text-muted-foreground py-8">No bets placed by this user yet.</p>
                        )}
                    </div>
                </CardContent>
                 {totalBetPages > 1 && (
                    <CardFooter className="flex justify-end items-center gap-4 border-t pt-4">
                        <span className="text-sm text-muted-foreground">Page {betCurrentPage} of {totalBetPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setBetCurrentPage(p => Math.max(p - 1, 1))} disabled={betCurrentPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setBetCurrentPage(p => Math.min(p + 1, totalBetPages))} disabled={betCurrentPage === totalBetPages}>Next</Button>
                    </CardFooter>
                )}
            </TabsContent>

            <TabsContent value="transactions">
                 <CardContent>
                    <div className="hidden md:block rounded-md border">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>UTR/Details</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTxns && paginatedTxns.length > 0 ? paginatedTxns.map((txn) => (
                            <TableRow key={txn.id}>
                                <TableCell className="py-0">{new Date(txn.date).toLocaleDateString('en-GB')}</TableCell>
                                <TableCell className="py-0"><Badge variant={txn.type === 'Deposit' ? 'default' : 'outline'}>{txn.type}</Badge></TableCell>
                                <TableCell className="py-0"><Badge variant={getStatusVariant(txn.status)}>{txn.status}</Badge></TableCell>
                                <TableCell className="text-xs py-0">{txn.utr || txn.description || 'N/A'}</TableCell>
                                <TableCell className="text-right font-mono py-0">₹{txn.amount.toFixed(2)}</TableCell>
                            </TableRow>
                            )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No transactions found for this user.</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                     <div className="grid gap-4 md:hidden">
                        {!areTxnsLoading && paginatedTxns && paginatedTxns.length > 0 ? paginatedTxns.map((txn) => (
                        <Card key={txn.id} className="p-4 text-xs">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold">{txn.type}</p>
                                    <p className="text-muted-foreground">{new Date(txn.date).toLocaleString('en-GB')}</p>
                                </div>
                                <Badge variant={getStatusVariant(txn.status)}>{txn.status}</Badge>
                            </div>
                            <div className="space-y-1 border-t pt-2">
                               <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-mono font-medium">₹{txn.amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Details:</span>
                                    <span className="text-xs truncate">{txn.utr || txn.description || 'N/A'}</span>
                                </div>
                            </div>
                        </Card>
                        )) : (
                        <p className="text-center text-muted-foreground py-8">No transactions found for this user.</p>
                        )}
                    </div>
                </CardContent>
                 {totalTxnPages > 1 && (
                    <CardFooter className="flex justify-end items-center gap-4 border-t pt-4">
                        <span className="text-sm text-muted-foreground">Page {txnCurrentPage} of {totalTxnPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setTxnCurrentPage(p => Math.max(p - 1, 1))} disabled={txnCurrentPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setTxnCurrentPage(p => Math.min(p + 1, totalTxnPages))} disabled={txnCurrentPage === totalTxnPages}>Next</Button>
                    </CardFooter>
                )}
            </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
