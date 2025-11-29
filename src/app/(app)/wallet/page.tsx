
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, DollarSign, PiggyBank, Trophy, Ticket, Flame, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";


// Type for user balance data
type UserBalance = {
    deposit: number;
    winning: number;
}

// Type for a single transaction
type Transaction = {
    id: string;
    amount: number;
    type: 'Deposit' | 'Withdrawal' | 'Bet' | 'Win' | 'Commission';
    status: 'Pending' | 'Completed' | 'Approved' | 'Rejected' | 'Won' | 'Lost' | 'Placed';
    description: string;
    date: string; // Date is stored as an ISO string
}

const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed':
        case 'Won':
        case 'Approved':
            return 'secondary';
        case 'Pending': 
            return 'default';
        case 'Rejected':
        case 'Lost':
            return 'destructive';
        default: return 'outline';
    }
}

const FeaturedMarkets = () => {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])


  const markets = [
    {
      name: "Kalahandi Day",
      slug: "kalahandi-day",
      description: "Din mein apni kismat aazmayein!",
    },
    {
      name: "Kalahandi Night",
      slug: "kalahandi-night",
      description: "Raat ke shandar inaam jeetein!",
    },
  ];

  return (
    <Card className="mt-6">
       <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="text-destructive h-5 w-5" />
            <span>Hamare Special Markets</span>
        </CardTitle>
        <CardDescription>In markets par bet lagayein aur bade inaam jeetein!</CardDescription>
      </CardHeader>
      <CardContent>
         {/* Carousel for Mobile */}
        <div className="sm:hidden overflow-hidden">
           <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {markets.map((market) => (
                <CarouselItem key={market.slug} className="pl-4">
                  <Card className="bg-accent/50 border-primary/50">
                    <CardHeader className="p-3">
                      <CardTitle className="text-base">{market.name}</CardTitle>
                      <CardDescription className="text-[11px] h-8">{market.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                       <Button asChild className="w-full" size="sm">
                        <Link href={`/play/${market.slug}`}>
                          <Ticket className="mr-2 h-4 w-4" /> Abhi Khelein
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
             <div className="py-2 flex justify-center gap-2">
                {markets.map((_, index) => (
                    <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={cn("h-2 w-2 rounded-full", current === index ? "bg-primary" : "bg-muted")}
                    />
                ))}
            </div>
          </Carousel>
        </div>

        {/* Grid for Desktop */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-4">
           {markets.map((market) => (
             <Card key={market.slug} className="bg-accent/50 border-primary/50">
               <CardHeader className="p-4">
                 <CardTitle className="text-lg">{market.name}</CardTitle>
                 <CardDescription className="text-sm">{market.description}</CardDescription>
               </CardHeader>
               <CardContent className="p-4 pt-0">
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/play/${market.slug}`}>
                      <Ticket className="mr-2 h-4 w-4" /> Abhi Khelein
                    </Link>
                  </Button>
               </CardContent>
             </Card>
           ))}
        </div>
      </CardContent>
    </Card>
  )
}

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
        const userDocRef = doc(firestore, "users", user.uid);
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
            collection(firestore, "transactions"), 
            where("userId", "==", user.uid),
            where("type", "in", ["Deposit", "Withdrawal"])
        );
        const transSnapshot = await getDocs(transQuery);
        const fetchedTransactions = transSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(fetchedTransactions);

    } catch (error) {
        console.error("Failed to fetch wallet data:", error);
    } finally {
        setIsLoading(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sort transactions on the client-side, exactly like the dashboard
  const sortedTransactions = useMemo(() => {
      if (!transactions) return [];
      return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);
  
  const totalBalance = useMemo(() => {
      if (!balance) return 0;
      return balance.deposit + balance.winning;
  }, [balance]);


  const recentTransactions = useMemo(() => sortedTransactions.slice(0, 10), [sortedTransactions]);

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
                        <CardDescription>View your account balance and manage your funds.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Unified Balance Card */}
                        <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-8 w-3/4" />
                                        <Skeleton className="h-8 w-3/4" />
                                        <Separator/>
                                        <Skeleton className="h-8 w-1/2" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <PiggyBank className="h-5 w-5" />
                                                    <span className="text-sm font-medium">Deposit Balance</span>
                                                </div>
                                                <span className="font-semibold text-base font-mono">₹{(balance?.deposit ?? 0).toFixed(0)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Trophy className="h-5 w-5" />
                                                    <span className="text-sm font-medium">Winning Balance</span>
                                                </div>
                                                <span className="font-semibold text-base font-mono">₹{(balance?.winning ?? 0).toFixed(0)}</span>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2 font-bold">
                                                <DollarSign className="h-5 w-5" />
                                                <span className="text-sm">Total Balance</span>
                                            </div>
                                            <span className="font-bold text-xl font-mono text-primary">₹{totalBalance.toFixed(0)}</span>
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

                         {/* Featured Markets Section */}
                        <FeaturedMarkets />

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
                                {recentTransactions.map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between px-4 py-2 border-b last:border-b-0">
                                        <div className="flex items-center gap-3">
                                            {tx.type === 'Deposit' ? 
                                                <ArrowDownLeft className="h-4 w-4 text-green-500" /> : 
                                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                                            }
                                            <div className="flex flex-col">
                                                <p className="text-xs font-medium">{tx.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.date).toLocaleString()} 
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <p className={`font-mono text-xs font-semibold ${tx.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'Deposit' ? '+' : '-'}{`₹${tx.amount.toFixed(0)}`}
                                            </p>
                                            <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
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
    </div>
  );
}
