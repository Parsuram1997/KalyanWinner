'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Market = {
  id: string;
  name: string;
};

export default function SelectMarketForResultsPage() {
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
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">View Results</h1>
        <p className="text-muted-foreground">Select a market to view its result history.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="p-4">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))
          : markets?.map((market) => (
              <Card key={market.id}>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{market.name}</CardTitle>
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/results/${generateSlug(market.name)}`}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      View Results
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
      </div>
       {!isLoading && markets?.length === 0 && (
          <p className="text-center text-muted-foreground col-span-full">
              No active markets found.
          </p>
      )}
    </div>
  );
}
