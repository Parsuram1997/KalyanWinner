
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
import { Ticket, BarChart3, ArrowLeft } from "lucide-react";
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
        <Button asChild variant="ghost" className="text-black dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 dark:hover:text-white w-fit">
            <Link href="/admin/manage-bidding">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Markets
            </Link>
        </Button>
        <Card className="w-full bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
            <CardHeader>
                <CardTitle className="text-3xl font-bold tracking-tight">Bidding for {marketName}</CardTitle>
                <CardDescription className="text-white/80">Select a report type or a specific game to view bid details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <Card className="bg-black/20 border-white/20">
                    <CardHeader>
                        <CardTitle className="text-base text-white">Aggregated Report</CardTitle>
                        <CardDescription className="text-xs text-white/80">View a combined report of all bids for this market.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full bg-white text-primary hover:bg-white/90" size="sm">
                            <Link href={`/admin/manage-bidding/${marketSlug}/aggregated`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Aggregated Report
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>

                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Individual Bet Types</h2>
                    <p className="text-white/80">View bids for a specific game type.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {isLoadingBetTypes
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="bg-black/20 border-white/20">
                            <CardHeader className="p-4 pb-2">
                                <Skeleton className="h-5 w-3/4 bg-white/20" />
                                <Skeleton className="h-3 w-full mt-1 bg-white/20" />
                            </CardHeader>
                            <CardFooter className="p-4 pt-2">
                                <Skeleton className="h-9 w-full bg-white/20" />
                            </CardFooter>
                        </Card>
                        ))
                    : <>
                        {specialBetTypes.map((bet) => (
                            <Card key={bet.slug} className="flex flex-col justify-between bg-black/20 border-white/20">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-base text-white">{bet.name}</CardTitle>
                                    <CardDescription className="text-xs text-white/80">{bet.description}</CardDescription>
                                </CardHeader>
                                <CardFooter className="p-4 pt-2">
                                    <Button asChild className="w-full bg-white text-primary hover:bg-white/90" size="sm">
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
                            <Card key={bet.id} className="flex flex-col justify-between bg-black/20 border-white/20">
                                <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base text-white">{bet.name}</CardTitle>
                                <CardDescription className="text-xs text-white/80">{bet.description}</CardDescription>
                                </CardHeader>
                                <CardFooter className="p-4 pt-2">
                                <Button asChild className="w-full bg-white text-primary hover:bg-white/90" size="sm">
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
                    <div className="col-span-full p-8 text-center text-white/80">
                        No active bet types found.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
