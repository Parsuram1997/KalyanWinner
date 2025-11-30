
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
import { Ticket, Ban } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type BetType = {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
};

type Result = {
    id: string;
    openPanna: string;
};

type Market = {
  id: string;
  closeBiddingTime: string;
};

export default function ChooseBetTypePage() {
  const params = useParams();
  const marketSlug = params.market as string;
  const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const firestore = useFirestore();

  const [todaysResult, setTodaysResult] = useState<Result | null | undefined>(undefined); // undefined means not yet fetched
  const [isLoadingResult, setIsLoadingResult] = useState(true);
  const [marketDetails, setMarketDetails] = useState<Market | null>(null);
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchMarketDetails = async () => {
        setIsLoadingMarket(true);
        const marketQuery = query(collection(firestore, "markets"), where("name", "==", marketName), limit(1));
        try {
            const snapshot = await getDocs(marketQuery);
            if (!snapshot.empty) {
                setMarketDetails({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Market);
            }
        } catch (error) {
            console.error("Error fetching market details:", error);
        } finally {
            setIsLoadingMarket(false);
        }
    };

    const fetchTodaysResult = async () => {
        setIsLoadingResult(true);
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const resultQuery = query(
            collection(firestore, "kalyan_results"),
            where("marketName", "==", marketName),
            where("date", "==", dateString),
            limit(1)
        );

        try {
            const snapshot = await getDocs(resultQuery);
            if (!snapshot.empty) {
                const resultDoc = snapshot.docs[0];
                setTodaysResult({ id: resultDoc.id, ...resultDoc.data() } as Result);
            } else {
                setTodaysResult(null); // No result for today
            }
        } catch (error) {
            console.error("Error fetching today's result:", error);
            setTodaysResult(null);
        } finally {
            setIsLoadingResult(false);
        }
    };

    fetchMarketDetails();
    fetchTodaysResult();
  }, [firestore, marketName]);

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

  const isDisabled = (betName: string) => {
      // If market is closed for the day, disable all
      if (marketDetails?.closeBiddingTime) {
          const now = new Date();
          const [hours, minutes] = marketDetails.closeBiddingTime.split(':').map(Number);
          const closeTime = new Date();
          closeTime.setHours(hours, minutes, 0, 0);
          if (now >= closeTime) return true;
      }
      
      // If open result has been declared, disable all "Open Session" bets
      if (todaysResult && todaysResult.openPanna) {
          const disabledAfterOpen = ['Jodi', 'Open Sangam', 'Full Sangam', 'Open', 'Close Sangam'];
          return disabledAfterOpen.includes(betName);
      }

      // "Close" bet should NOT be disabled if open result is not out
      if (betName === 'Close') {
          return false;
      }

      return false; 
  };
  
  const isLoading = isLoadingBetTypes || isLoadingResult || isLoadingMarket;

  return (
    <div className="flex flex-col gap-6">
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
          : betTypes?.map((bet) => {
              const disabled = isDisabled(bet.name);
              return (
              <Card key={bet.id} className={cn("flex flex-col justify-between", disabled && "bg-muted/50 opacity-60")}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{bet.name}</CardTitle>
                  <CardDescription className="text-xs">{bet.description}</CardDescription>
                </CardHeader>
                <CardFooter className="p-4 pt-2">
                  <Button asChild className="w-full" size="sm" disabled={disabled}>
                    <Link 
                        href={disabled ? '#' : `/play/${marketSlug}/${generateSlug(bet.name)}`} 
                        aria-disabled={disabled} 
                        tabIndex={disabled ? -1 : undefined}
                        onClick={(e) => { if (disabled) e.preventDefault(); }}
                    >
                      {disabled ? <Ban className="mr-2 h-4 w-4" /> : <Ticket className="mr-2 h-4 w-4" />}
                      {disabled ? 'Betting Closed' : 'Place Bet'}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              )
          })}
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
