
"use client";

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
  slug: string;
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
  const { data: markets, isLoading } = useCollection<Market>(activeMarketsQuery);

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Manage Results</h1>
        <p className="text-muted-foreground">Select a market to add or view results.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          : markets?.map((market) => (
              <Card key={market.id}>
                <CardHeader>
                  <CardTitle>{market.name}</CardTitle>
                </CardHeader>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/admin/manage-results/${generateSlug(market.name)}`}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Manage Results
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
