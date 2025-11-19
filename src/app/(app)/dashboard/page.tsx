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
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


const ACTIVITY_PER_PAGE = 5;

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
        // 1. Fetch all markets from the 'markets' collection
        const marketsQuery = query(collection(firestore, "markets"), orderBy("name"));
        const marketsSnapshot = await getDocs(marketsQuery);
        const marketNames = marketsSnapshot.docs.map(doc => doc.data().name);

        // 2. Fetch the latest result for each market
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
          .filter(Boolean); // Filter out nulls for markets with no results
        
        // 3. Sort results by date descending, so the absolute latest is first
        results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setLatestResults(results);
      } catch (error) {
        console.error("Error fetching latest results: ", error);
      } finally {
        setResultsLoading(false);
      }
    };

    fetchLatestResults();
  }, [firestore]);


  const isLoading = isUserLoading || isUserDataLoading || isActivityLoading || isResultsLoading;

  const totalPages = Math.ceil((sortedRecentActivity?.length || 0) / ACTIVITY_PER_PAGE);

  const paginatedActivity = useMemo(() => {
    if (!sortedRecentActivity) return [];
    const startIndex = (currentPage - 1) * ACTIVITY_PER_PAGE;
    const endIndex = startIndex + ACTIVITY_PER_PAGE;
    return sortedRecentActivity.slice(startIndex, endIndex);
  }, [sortedRecentActivity, currentPage]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/20 to-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="text-base">Wallet Balance</CardTitle>
                <CardDescription>Your available funds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
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
                            <span className="font-semibold text-lg">{depositBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Trophy className="h-5 w-5" />
                                <span className="text-sm font-medium">Winnings</span>
                            </div>
                            <span className="font-semibold text-lg">{winningBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t mt-4">
                            <div className="flex items-center gap-2 font-bold">
                                <DollarSign className="h-5 w-5" />
                                <span className="text-sm">Total</span>
                            </div>
                            <span className="font-bold text-xl text-primary">{totalBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button size="sm" asChild className="w-full">
                <Link href="/wallet">
                    <Wallet className="mr-1.5 h-4 w-4" /> Manage Funds
                </Link>
                </Button>
            </CardFooter>
            </Card>
        <Card className="bg-gradient-to-tl from-secondary/20 to-background hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Latest Results</CardTitle>
            <CardDescription>Swipe to see results for all markets.</CardDescription>
          </CardHeader>
          {isLoading ? (
            <CardContent className="p-6 pt-0 flex-1 flex items-center justify-center">
                <Skeleton className="h-24 w-full" />
            </CardContent>
          ) : latestResults.length > 0 ? (
            <Carousel setApi={setApi} className="w-full h-full flex flex-col justify-center">
                <CarouselContent>
                {latestResults.map((result) => (
                    <CarouselItem key={result.id} className="h-full">
                    <CardContent className="p-6 pt-0 flex items-center justify-center">
                        {result.jodi === 'L' ? (
                            <div className="flex flex-col items-center gap-2 text-center">
                                <p className="text-lg font-semibold">{result.marketName}</p>
                                <Badge variant="destructive" className="text-base">HOLIDAY</Badge>
                                <p className="text-[10px] text-muted-foreground">{new Date(result.date).toLocaleDateString('en-GB')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 w-full">
                            <div className="text-center">
                                <p className="text-[10px] text-muted-foreground">{new Date(result.date).toLocaleDateString('en-GB')}</p>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground">Open</span>
                                <span className="text-2xl font-bold tracking-widest">{result.openPanna}</span>
                                </div>
                                <div className="flex flex-col items-center rounded-md bg-primary px-3 py-1 text-primary-foreground">
                                <span className="text-3xl font-bold tracking-wider">{result.jodi}</span>
                                <span className="text-[10px] font-medium">{result.marketName}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground">Close</span>
                                <span className="text-2xl font-bold tracking-widest">{result.closePanna}</span>
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
                        current === index ? "bg-primary" : "bg-muted"
                    )}
                    />
                ))}
                </div>
            </Carousel>
          ) : (
             <CardContent className="p-6 pt-0 flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No recent results found.</p>
             </CardContent>
          )}
          <CardFooter className="mt-auto pt-4">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/results">View All Results</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="bg-gradient-to-tr from-accent/10 to-background hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
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
                        <TableCell>
                          <div className="font-medium">{activity.description}</div>
                        </TableCell>
                        <TableCell>
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
                        <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                        <TableCell className={`text-right font-semibold ${activity.amount > 0 ? 'text-green-600' : ''}`}>
                          {activity.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-4 md:hidden">
                {paginatedActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{activity.description}</div>
                      <div className="text-sm text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${activity.amount > 0 ? 'text-green-600' : ''}`}>{activity.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
                      <Badge 
                        variant={
                            activity.status === "Won" || activity.status === "Completed" ? "secondary" :
                            activity.status === "Pending" ? "default" :
                            "outline"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4">
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
    </div>
  );
}
