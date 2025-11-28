
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Ticket, BarChart3 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type BetType = {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
};

export default function BiddingMarketHubPage() {
  const params = useParams();
  const marketSlug = params.market as string;
  const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const firestore = useFirestore();

  const betTypesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "bet_types"), where("status", "==", "Active"))
        : null,
    [firestore]
  );
  const { data: betTypes, isLoading: isLoadingBetTypes } = useCollection<BetType>(betTypesQuery, { skip: !firestore });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[()]/g, '');
  }
  
  const specialBetTypes = [
    { name: 'Open', slug: 'open', description: "View all bids for the Open digit." },
    { name: 'Close', slug: 'close', description: "View all bids for the Close digit." },
  ];

  return (
    <div className="flex flex-col gap-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Bidding for {marketName}</h1>
            <p className="text-muted-foreground">Select a report type or a specific game to view bid details.</p>
        </div>

        <Card className="w-full">
             <CardHeader>
                  <CardTitle className="text-base">Aggregated Report</CardTitle>
                  <CardDescription className="text-xs">View a combined report of all bids for this market, grouped by session.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/admin/manage-bidding/${marketSlug}/aggregated`}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Aggregated Report
                    </Link>
                  </Button>
                </CardFooter>
        </Card>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Individual Bet Types</h2>
        <p className="text-muted-foreground">View bids for a specific game type.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoadingBetTypes
          ? Array.from({ length: 8 }).map((_, i) => (
               <Card key={i}>
                <CardHeader className="p-4 pb-2">
                  <Skeleton className="h-5 w-3/4" />
                   <Skeleton className="h-3 w-full mt-1" />
                </CardHeader>
                <CardFooter className="p-4 pt-2">
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))
          : <>
              {specialBetTypes.map((bet) => (
                 <Card key={bet.slug} className="flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{bet.name}</CardTitle>
                      <CardDescription className="text-xs">{bet.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-2">
                      <Button asChild className="w-full" size="sm">
                        <Link href={`/admin/manage-bidding/${marketSlug}/${bet.slug}`} >
                          <Ticket className="mr-2 h-4 w-4" />
                          View Bids
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
              ))}
              {betTypes?.filter(bt => !['Open', 'Close'].includes(bt.name)).map((bet) => {
                  return (
                  <Card key={bet.id} className="flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{bet.name}</CardTitle>
                      <CardDescription className="text-xs">{bet.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-2">
                      <Button asChild className="w-full" size="sm">
                        <Link href={`/admin/manage-bidding/${marketSlug}/${generateSlug(bet.name)}`} >
                          <Ticket className="mr-2 h-4 w-4" />
                          View Bids
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                  )
              })}
            </>}
      </div>
       {!isLoadingBetTypes && betTypes?.length === 0 && (
        <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
                No active bet types found.
            </CardContent>
        </Card>
      )}
    </div>
  );
}
