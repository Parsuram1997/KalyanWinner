
"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Wallet, PiggyBank, Trophy } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ACTIVITY_PER_PAGE = 25;

const WalletCard = ({ isLoading, depositBalance, winningBalance, totalBalance }: { isLoading: boolean, depositBalance: number, winningBalance: number, totalBalance: number }) => (
    <Card className="bg-gradient-to-br from-primary/20 to-accent/20 hover:shadow-lg transition-shadow">
        <CardHeader className="p-4">
            <CardTitle className="text-base">Wallet Balance</CardTitle>
            <CardDescription>Your available funds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <PiggyBank className="h-5 w-5" />
                            <span className="text-sm font-medium">Deposit</span>
                        </div>
                        <span className="font-semibold text-lg">₹{depositBalance.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Trophy className="h-5 w-5" />
                            <span className="text-sm font-medium">Winnings</span>
                        </div>
                        <span className="font-semibold text-lg">₹{winningBalance.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <div className="flex items-center gap-2 font-bold">
                            <DollarSign className="h-5 w-5" />
                            <span className="text-sm">Total</span>
                        </div>
                        <span className="font-bold text-xl text-primary">₹{totalBalance.toFixed(0)}</span>
                    </div>
                </div>
            )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Button size="sm" asChild className="w-full">
            <Link href="/wallet">
                <Wallet className="mr-1.5 h-4 w-4" /> Manage Funds
            </Link>
            </Button>
        </CardFooter>
    </Card>
);

const ResultsCard = ({ isLoading, latestResults, api, onCarouselApiSet, current }: { isLoading: boolean, latestResults: any[], api: CarouselApi | undefined, onCarouselApiSet: (api: CarouselApi) => void, current: number }) => (
    <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
        <CardHeader>
            <CardTitle className="text-base">Latest Results</CardTitle>
            <CardDescription className="text-white/80">Swipe to see results for all markets.</CardDescription>
        </CardHeader>
        {isLoading ? (
            <CardContent className="p-6 pt-0 flex-1 flex items-center justify-center">
                <Skeleton className="h-24 w-full bg-white/20" />
            </CardContent>
        ) : latestResults.length > 0 ? (
            <Carousel setApi={onCarouselApiSet} className="w-full">
                <CarouselContent>
                    {latestResults.map((result) => (
                        <CarouselItem key={result.id}>
                            <CardContent className="p-6 pt-0 flex items-center justify-center">
                                {result.jodi === 'L' ? (
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <p className="text-base font-semibold">{result.marketName}</p>
                                        <Badge variant="destructive" className="text-sm">HOLIDAY</Badge>
                                        <p className="text-xs text-white/70">{new Date(result.date).toLocaleDateString('en-GB')}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 w-full">
                                        <div className="text-center">
                                            <p className="text-xs text-white/70">{new Date(result.date).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="flex flex-col items-center text-center">
                                                <span className="text-xs text-white/70">Open</span>
                                                <span className="text-xl font-bold tracking-tight">{result.openPanna}</span>
                                            </div>
                                            <div className="flex flex-col items-center rounded-md bg-black/20 px-3 py-1 text-white text-center">
                                                <span className="text-2xl font-bold tracking-tight">{result.jodi}</span>
                                                <span className="text-[10px] font-medium leading-tight">{result.marketName}</span>
                                            </div>
                                            <div className="flex flex-col items-center text-center">
                                                <span className="text-xs text-white/70">Close</span>
                                                <span className="text-xl font-bold tracking-tight">{result.closePanna}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="flex justify-center gap-2 mt-2">
                    {latestResults.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={cn(
                                "h-2 w-2 rounded-full transition-colors",
                                current === index ? "bg-white" : "bg-white/50"
                            )}
                        />
                    ))}
                </div>
            </Carousel>
        ) : (
            <CardContent className="p-6 pt-0 flex-1 flex items-center justify-center">
                <p className="text-sm text-white/80">No recent results found.</p>
            </CardContent>
        )}
        <CardFooter className="mt-auto pt-4">
            <Button variant="secondary" size="sm" className="w-full" asChild>
                <Link href="/results">View All Results</Link>
            </Button>
        </CardFooter>
    </Card>
);

const ActivityCard = ({ isActivityLoading, sortedRecentActivity, paginatedActivity, currentPage, totalPages, setCurrentPage }: { isActivityLoading: boolean, sortedRecentActivity: any[], paginatedActivity: any[], currentPage: number, totalPages: number, setCurrentPage: (page: number | ((prev: number) => number)) => void }) => (
    <Card className="bg-gradient-to-tr from-accent/10 to-background hover:shadow-lg transition-shadow">
    <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
    </CardHeader>
    <CardContent className="p-0 sm:p-6">
        {isActivityLoading ? <Skeleton className="h-40 w-full" /> : sortedRecentActivity && sortedRecentActivity.length > 0 ? (
        <>
            <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedActivity.map((activity) => (
                    <TableRow key={activity.id}>
                    <TableCell className="py-2">
                        <div className="font-medium">{activity.description}</div>
                    </TableCell>
                    <TableCell className="py-2">
                        <Badge
                        variant={
                            activity.status === "Won" || activity.status === "Completed" ? "secondary" :
                            activity.status === "Pending" ? "default" :
                            "outline"
                        }
                        >
                        {activity.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="py-2">{new Date(activity.date).toLocaleDateString()}</TableCell>
                    <TableCell className={`text-right font-semibold py-2 ${activity.amount > 0 ? 'text-green-600' : ''}`}>
                        ₹{activity.amount.toFixed(0)}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
            <div className="md:hidden">
            {paginatedActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b px-4 py-3 last:border-b-0">
                <div>
                    <div className="font-medium text-xs">{activity.description}</div>
                    <div className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                    <div className={`text-xs font-semibold ${activity.amount > 0 ? 'text-green-600' : ''}`}>
                        ₹{activity.amount.toFixed(0)}
                    </div>
                    <Badge
                    variant={
                        activity.status === "Won" || activity.status === "Completed" ? "secondary" :
                        activity.status === "Pending" ? "default" :
                        "outline"
                    }
                    className="text-xs"
                    >
                    {activity.status}
                    </Badge>
                </div>
                </div>
            ))}
            </div>
            <div className="flex items-center justify-between mt-4 px-4 sm:px-0">
            <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            >
                Previous
            </Button>
            <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            >
                Next
            </Button>
            </div>
        </>
        ) : (
        <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity found.</p>
        </div>
        )}
    </CardContent>
    </Card>
);

export default function DashboardPage() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, "users", authUser.uid) : null),
    [firestore, authUser]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<any>(userDocRef);
  const depositBalance = userData?.depositBalance ?? 0;
  const winningBalance = userData?.winningBalance ?? 0;
  const totalBalance = depositBalance + winningBalance;

  const transactionsQuery = useMemoFirebase(
    () => (firestore && authUser ? query(
      collection(firestore, "transactions"),
      where("userId", "==", authUser.uid)
    ) : null),
    [firestore, authUser]
  );
  const { data: recentActivity, isLoading: isActivityLoading } = useCollection<any>(
    transactionsQuery,
    { skip: !firestore || !authUser }
  );

  const sortedRecentActivity = useMemo(() => {
    if (!recentActivity) return [];
    return [...recentActivity].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
  }, [recentActivity]);

  const [latestResults, setLatestResults] = useState<any[]>([]);
  const [isResultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestResults = async () => {
      if (!firestore) return;
      setResultsLoading(true);
      
      try {
        const marketsQuery = query(collection(firestore, "markets"), orderBy("name"));
        const marketsSnapshot = await getDocs(marketsQuery);
        const marketNames = marketsSnapshot.docs.map(doc => doc.data().name);

        const resultsPromises = marketNames.map(marketName => {
            const q = query(
            collection(firestore, "kalyan_results"),
            where("marketName", "==", marketName),
            orderBy("date", "desc"),
            limit(1)
            );
            return getDocs(q);
        });

        const snapshots = await Promise.all(resultsPromises);
        const results = snapshots
          .map(snapshot => snapshot.docs.length > 0 ? {id: snapshot.docs[0].id, ...snapshot.docs[0].data()} : null)
          .filter((result): result is { id: string; date: any } => result !== null && (result as any).date !== undefined);
        
        results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setLatestResults(results as any[]);
      } catch (error) {
        console.error("Error fetching latest results: ", error);
      } finally {
        setResultsLoading(false);
      }
    };

    if(firestore) {
      fetchLatestResults();
    }
  }, [firestore]);


  const isLoading = isUserLoading || isUserDataLoading || isActivityLoading || isResultsLoading;

  const totalPages = Math.ceil((sortedRecentActivity?.length || 0) / ACTIVITY_PER_PAGE);

  const paginatedActivity = useMemo(() => {
    if (!sortedRecentActivity) return [];
    const startIndex = (currentPage - 1) * ACTIVITY_PER_PAGE;
    const endIndex = startIndex + ACTIVITY_PER_PAGE;
    return sortedRecentActivity.slice(startIndex, endIndex);
  }, [sortedRecentActivity, currentPage]);

  const onCarouselApiSet = (api: CarouselApi) => {
    if (!api) {
      return;
    }
    setApi(api);
  };

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
    api.on("reInit", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="flex flex-col gap-6">
      {/* Desktop Layout */}
      <div className="hidden md:grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <WalletCard 
            isLoading={isLoading} 
            depositBalance={depositBalance} 
            winningBalance={winningBalance} 
            totalBalance={totalBalance} 
        />
        <ResultsCard 
            isLoading={isLoading} 
            latestResults={latestResults} 
            api={api}
            onCarouselApiSet={onCarouselApiSet}
            current={current}
        />
      </div>
      <div className="hidden md:block">
        <ActivityCard 
            isActivityLoading={isActivityLoading}
            sortedRecentActivity={sortedRecentActivity || []}
            paginatedActivity={paginatedActivity}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
        />
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden">
        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-4">
                <div className="grid gap-6">
                    <WalletCard 
                        isLoading={isLoading} 
                        depositBalance={depositBalance} 
                        winningBalance={winningBalance} 
                        totalBalance={totalBalance} 
                    />
                    <ResultsCard 
                        isLoading={isLoading} 
                        latestResults={latestResults} 
                        api={api}
                        onCarouselApiSet={onCarouselApiSet}
                        current={current}
                    />
                </div>
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
                <ActivityCard 
                    isActivityLoading={isActivityLoading}
                    sortedRecentActivity={sortedRecentActivity || []}
                    paginatedActivity={paginatedActivity}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
