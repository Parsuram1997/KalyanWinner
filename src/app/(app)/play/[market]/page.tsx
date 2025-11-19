
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
import { Ticket } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChooseBetTypePage() {
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
  const { data: betTypes, isLoading } = useCollection<any>(betTypesQuery, { skip: !firestore });

  return (
    <div className="flex flex-col gap-6">
       <div>
          <h1 className="text-2xl font-bold tracking-tight">Choose Bet Type</h1>
          <p className="text-muted-foreground">Market: <span className="font-semibold text-primary">{marketName}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
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
          : betTypes?.map((bet) => (
          <Card key={bet.id} className="flex flex-col justify-between">
             <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{bet.name}</CardTitle>
              <CardDescription className="text-xs">{bet.description}</CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-2">
               <Button asChild className="w-full" size="sm">
                <Link href={`/play/${marketSlug}/${bet.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Place Bet
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       {!isLoading && betTypes?.length === 0 && (
        <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
                No active bet types found.
            </CardContent>
        </Card>
      )}
    </div>
  );
}
