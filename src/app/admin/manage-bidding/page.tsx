
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  CardContent,
  CardDescription
} from "@/components/ui/card";
import { Ticket } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Market = {
  id: string;
  name: string;
};

export default function SelectMarketForBiddingPage() {
  const firestore = useFirestore();
  const activeMarketsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "markets"), where("status", "==", "Active"))
        : null,
    [firestore]
  );
  const { data: markets, isLoading } = useCollection<Market>(activeMarketsQuery, { skip: !firestore });

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

  return (
    <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
            <CardTitle>Manage Bidding</CardTitle>
            <CardDescription className="text-white/80">
                Select a market to view all bids.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="bg-black/20 border-white/20">
                        <CardHeader className="p-4">
                        <Skeleton className="h-5 w-3/4 bg-white/20" />
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                        <Skeleton className="h-9 w-full bg-white/20" />
                        </CardFooter>
                    </Card>
                    ))
                : markets?.map((market) => (
                    <Card key={market.id} className="bg-black/20 border-white/20">
                        <CardHeader className="p-4">
                        <CardTitle className="text-base text-white">{market.name}</CardTitle>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                        <Button asChild className="w-full bg-white text-primary hover:bg-white/90" size="sm">
                            <Link href={`/admin/manage-bidding/${generateSlug(market.name)}`}>
                            <Ticket className="mr-2 h-4 w-4" />
                            View Bids
                            </Link>
                        </Button>
                        </CardFooter>
                    </Card>
                    ))}
            </div>
            {!isLoading && markets?.length === 0 && (
                <div className="text-center text-white/80 pt-8">
                <p>No active markets found.</p>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
