
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
  ArrowRight,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Type for user balance data
type UserBalance = {
  deposit: number;
  winning: number;
};

// Type for a single transaction
type Transaction = {
  id: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | 'Bet' | 'Win' | 'Commission';
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
};

const getStatusVariant = (status: Transaction['status']) => {
  switch (status) {
    case 'Completed':
    case 'Won':
    case 'Approved':
      return 'secondary';
    case 'Pending':
      return 'default';
    case 'Rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

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
        <Card>
            <CardHeader>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Flame className="text-destructive h-5 w-5" />
                    <span>Hamare Special Markets</span>
                </h3>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {markets.map((market, index) => (
                    <Card key={index} className="bg-accent/50 border-primary/50 h-full flex flex-col justify-between">
                      <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-base">{market.name}</CardTitle>
                          <CardDescription className="text-xs h-8">{market.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-3 pt-2 mt-auto">
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

  const fetchData = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    try {
      // Fetch balance
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setBalance({
          deposit: data.depositBalance || 0,
          winning: data.winningBalance || 0,
        });
      }

      // Fetch only deposit and withdrawal transactions
      const transQuery = query(
        collection(firestore, 'transactions'),
        where('userId', '==', user.uid),
        where('type', 'in', ['Deposit', 'Withdrawal']),
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
    () => transactions.slice(0, 10),
    [transactions]
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="wallet" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Wallet</CardTitle>
              <CardDescription>
                View your account balance and manage your funds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Unified Balance Card */}
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-8 w-3/4" />
                      <Separator />
                      <Skeleton className="h-8 w-1/2" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <PiggyBank className="h-5 w-5" />
                            <span className="text-sm font-medium">
                              Deposit Balance
                            </span>
                          </div>
                          <span className="font-semibold text-base font-mono">
                            ₹{(balance?.deposit ?? 0).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Trophy className="h-5 w-5" />
                            <span className="text-sm font-medium">
                              Winning Balance
                            </span>
                          </div>
                          <span className="font-semibold text-base font-mono">
                            ₹{(balance?.winning ?? 0).toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 font-bold">
                          <DollarSign className="h-5 w-5" />
                          <span className="text-sm">Total Balance</span>
                        </div>
                        <span className="font-bold text-xl font-mono text-primary">
                          ₹{totalBalance.toFixed(0)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <Button asChild size="lg">
                  <Link href="/wallet/deposit">Make a Deposit</Link>
                </Button>
                <Button asChild size="lg" variant="destructive">
                  <Link href="/wallet/withdraw">Request Withdrawal</Link>
                </Button>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : recentTransactions.length > 0 ? (
                <div className="border-t sm:border rounded-md">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-4 py-2 border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        {tx.type === 'Deposit' ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                        <div className="flex flex-col">
                          <p className="text-xs font-medium">
                            {tx.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p
                          className={`font-mono text-xs font-semibold ${
                            tx.type === 'Deposit'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'Deposit' ? '+' : '-'}
                          {`₹${tx.amount.toFixed(0)}`}
                        </p>
                        <Badge variant={getStatusVariant(tx.status)}>
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground p-4">
                  You have no recent activity.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        
      {/* Featured Markets Section - Now outside the main Card */}
      <FeaturedMarkets />
    </div>
  );
}
