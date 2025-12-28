'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Market = {
  id: string;
  name: string;
};

export default function SelectMarketForResultsPage() {
  const firestore = useFirestore();
  // CORRECTED: The field to check for active markets is `active` (boolean), not `status` (string).
  const activeMarketsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "markets"), where("active", "==", true))
        : null,
    [firestore]
  );
  const { data: markets, isLoading } = useCollection<Market>(activeMarketsQuery);

  // CORRECTED: Slug should be generated with hyphens for cleaner URLs.
  const generateSlug = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle>View Results</CardTitle>
          <CardDescription className="text-white/80">Select a market to view its result history.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
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
                  <Card key={market.id} className="bg-black/20 border-white/20 text-white">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">{market.name}</CardTitle>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                      <Button asChild className="w-full bg-white text-primary hover:bg-white/90" size="sm">
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
              <p className="text-center text-white/80 col-span-full py-8">
                  No active markets found.
              </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
