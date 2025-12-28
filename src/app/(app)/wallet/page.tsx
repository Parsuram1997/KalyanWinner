
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore } from '@/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PiggyBank,
  Trophy,
  Ticket,
  Flame,
  CreditCard,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Type for user balance data
type UserBalance = {
  deposit: number;
  winning: number;
  credit: number;
};

// Type for a single transaction
type Transaction = {
  id: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | 'Bet' | 'Win' | 'Commission' | 'Credit' | 'Credit Repayment';
  status:
    | 'Pending'
    | 'Completed'
    | 'Approved'
    | 'Rejected'
    | 'Won'
    | 'Lost'
    | 'Placed';
  description: string;
  date: string; // Date is stored as an ISO string
  fee?: number;
  netAmount?: number;
};

const ITEMS_PER_PAGE = 10;

const FeaturedMarkets = () => {
    const markets = [
      {
        name: 'Kalahandi Day',
        slug: 'kalahandi-day',
        description: 'Din mein apni kismat aazmayein!',
      },
      {
        name: 'Kalahandi Night',
        slug: 'kalahandi-night',
        description: 'Raat ke shandar inaam jeetein!',
      },
    ];

    return (
        <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
            <CardHeader>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Flame className="text-red-400 h-5 w-5" />
                    <span>Hamare Special Markets</span>
                </h3>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {markets.map((market, index) => (
                    <Card key={index} className="bg-black/20 border-white/20 h-full flex flex-col justify-between">
                      <CardHeader className="p-2 pb-0">
                          <CardTitle className="text-base text-white">{market.name}</CardTitle>
                          <CardDescription className="text-xs h-8 text-white/80">{market.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-2 pt-2 mt-auto">
                          <Button asChild className="w-full" size="sm">
                              <Link href={`/play/${market.slug}`}><Ticket className="mr-2 h-4 w-4" /> Abhi Khelein</Link>
                          </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
            </CardContent>
        </Card>
    );
};


export default function WalletPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);


  const fetchData = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setBalance({
          deposit: data.depositBalance || 0,
          winning: data.winningBalance || 0,
          credit: data.creditBalance || 0,
        });
      }

      const transQuery = query(
        collection(firestore, 'transactions'),
        where('userId', '==', user.uid),
        where('type', 'in', ['Deposit', 'Withdrawal', 'Credit', 'Credit Repayment']),
        orderBy('date', 'desc')
      );
      const transSnapshot = await getDocs(transQuery);
      const fetchedTransactions = transSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
      );
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalBalance = useMemo(() => {
    if (!balance) return 0;
    return balance.deposit + balance.winning;
  }, [balance]);

  const recentTransactions = useMemo(
    () => transactions,
    [transactions]
  );
  
  const totalPages = useMemo(
    () => Math.ceil(recentTransactions.length / ITEMS_PER_PAGE),
    [recentTransactions]
  );

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return recentTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [recentTransactions, currentPage]);

  const getTransactionTypeStyle = (type: Transaction['type']) => {
      switch(type) {
          case 'Deposit':
          case 'Win':
          case 'Credit':
              return 'text-green-400';
          case 'Withdrawal':
          case 'Bet':
          case 'Credit Repayment':
              return 'text-red-400';
          default:
              return 'text-white';
      }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1">
          <TabsTrigger value="wallet">My Wallet</TabsTrigger>
          <TabsTrigger value="activity">Passbook</TabsTrigger>
        </TabsList>
        <TabsContent value="wallet" className="mt-4 space-y-6">
          <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
            <CardHeader>
              <CardTitle>My Wallet</CardTitle>
              <CardDescription className="text-white/80">
                View your account balance and manage your funds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="bg-black/20 border border-white/20">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4 bg-white/20" />
                      <Skeleton className="h-8 w-3/4 bg-white/20" />
                      <Skeleton className="h-8 w-3/4 bg-white/20" />
                      <Separator className="bg-white/20"/>
                      <Skeleton className="h-8 w-1/2 bg-white/20" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white/80">
                            <PiggyBank className="h-5 w-5" />
                            <span className="text-sm font-medium">Deposit Balance</span>
                          </div>
                          <span className="font-semibold text-base font-mono text-white">
                            ₹{(balance?.deposit ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white/80">
                            <Trophy className="h-5 w-5" />
                            <span className="text-sm font-medium">Winning Balance</span>
                          </div>
                          <span className="font-semibold text-base font-mono text-white">
                            ₹{(balance?.winning ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-red-400/90">
                            <CreditCard className="h-5 w-5" />
                            <span className="text-sm font-medium">Outstanding Credit</span>
                          </div>
                          <span className="font-semibold text-base font-mono text-red-400">
                            ₹{(balance?.credit ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <Separator className="bg-white/20"/>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <DollarSign className="h-5 w-5" />
                          <span className="text-sm">Total Playable Balance</span>
                        </div>
                        <span className="font-bold text-xl font-mono text-white">
                          ₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/20">
                <Button asChild size="lg"><Link href="/wallet/deposit">Make a Deposit</Link></Button>
                <Button asChild size="lg" variant="destructive"><Link href="/wallet/withdraw">Request Withdrawal</Link></Button>
              </div>
            </CardContent>
          </Card>
          
          <FeaturedMarkets />

        </TabsContent>
        <TabsContent value="activity" className="mt-4">
            {/* ... Passbook/Activity content is largely the same, but we update the styling logic */}
            <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
                <CardHeader><h3 className="text-lg font-semibold text-white">Passbook</h3></CardHeader>
                <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                    <Skeleton className="h-12 w-full bg-white/20" />
                    <Skeleton className="h-12 w-full bg-white/20" />
                    <Skeleton className="h-12 w-full bg-white/20" />
                    </div>
                ) : paginatedTransactions.length > 0 ? (
                    <>
                    <div className="hidden md:block rounded-md border border-white/20">
                        <Table>
                        <TableHeader className="border-b-white/20">
                            <TableRow>
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">Description</TableHead>
                            <TableHead className="text-white">Amount</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTransactions.map((tx) => (
                            <TableRow key={tx.id} className="border-white/20">
                                <TableCell className="py-2 text-xs text-white/80">{new Date(tx.date).toLocaleString()}</TableCell>
                                <TableCell className="py-2 text-sm text-white">{tx.description}</TableCell>
                                <TableCell className={cn('py-2 font-mono font-semibold', getTransactionTypeStyle(tx.type))}>
                                {tx.type.includes('Repayment') || tx.type === 'Withdrawal' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell className="py-2"><Badge variant={null} className={/*...*/'text-xs'}>{tx.status}</Badge></TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                    <div className="md:hidden grid gap-3">
                        {paginatedTransactions.map((tx) => (
                        <Card key={tx.id} className="bg-black/20 border-white/20 text-white py-3">
                            {/* ... Mobile card view with updated styles */}
                        </Card>
                        ))}
                    </div>
                    </>
                ) : (
                    <p className="text-center text-sm text-white/80 p-4">You have no recent activity.</p>
                )}
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-between pt-6">{/* ... Pagination ... */}</CardFooter>
                )}
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
