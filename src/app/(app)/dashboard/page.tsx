
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
import { DollarSign, Wallet } from "lucide-react";
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
import { collection, doc, query, where, orderBy, limit } from "firebase/firestore";
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
  const walletBalance = userData?.balance ?? 0;

  const transactionsQuery = useMemoFirebase(
    () => authUser && firestore ? query(
        collection(firestore, "transactions"), 
        where("userId", "==", authUser.uid)
    ) : null,
    [authUser, firestore]
  );
  
  // Fetch transactions only when the query is ready
  const { data: recentActivity, isLoading: isActivityLoading } = useCollection<any>(
    authUser ? transactionsQuery : null
  );


  const sortedRecentActivity = useMemo(() => {
    if (!recentActivity) return [];
    // Sort by date in descending order (most recent first)
    return [...recentActivity].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
  }, [recentActivity]);


  const kalyanDayResultQuery = useMemoFirebase(
    () => firestore ? query(
      collection(firestore, "kalyan_results"),
      where("marketName", "==", "Kalyan Day"),
      orderBy("date", "desc"),
      limit(1)
    ) : null,
    [firestore]
  );
  const { data: kalyanDayResult, isLoading: isDayResultLoading } = useCollection<any>(kalyanDayResultQuery);

  const kalyanNightResultQuery = useMemoFirebase(
    () => firestore ? query(
      collection(firestore, "kalyan_results"),
      where("marketName", "==", "Kalyan Night"),
      orderBy("date", "desc"),
      limit(1)
    ) : null,
    [firestore]
  );
  const { data: kalyanNightResult, isLoading: isNightResultLoading } = useCollection<any>(kalyanNightResultQuery);

  const latestResults = useMemo(() => {
    const results = [];
    if (kalyanDayResult?.[0]) results.push(kalyanDayResult[0]);
    if (kalyanNightResult?.[0]) results.push(kalyanNightResult[0]);
    return results;
  }, [kalyanDayResult, kalyanNightResult]);

  const isLoading = isUserLoading || isUserDataLoading || isActivityLoading || isDayResultLoading || isNightResultLoading;

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold">
                {walletBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Your available funds.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm" asChild>
              <Link href="/wallet">
                <Wallet className="mr-1.5 h-4 w-4" /> Manage Funds
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="bg-gradient-to-tl from-secondary/20 to-background hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Latest Result</CardTitle>
            <CardDescription>Swipe to see Day and Night results.</CardDescription>
          </CardHeader>
          {isLoading ? (
            <CardContent className="p-6 pt-0 flex-1 flex items-center justify-center">
                <Skeleton className="h-24 w-full" />
            </CardContent>
          ) : latestResults.length > 0 ? (
            <Carousel setApi={setApi} className="w-full h-full flex flex-col justify-center">
                <CarouselContent>
                {latestResults.map((result, index) => (
                    <CarouselItem key={index} className="h-full">
                    <CardContent className="p-6 pt-0 flex items-center justify-center">
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
                <p className="text-sm text-muted-foreground">No results found.</p>
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
          {isLoading ? <Skeleton className="h-40 w-full" /> : sortedRecentActivity && sortedRecentActivity.length > 0 ? (
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

    
    