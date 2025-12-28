
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Ticket, Clock, Loader } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Market = {
  id: string;
  name: string;
  openBiddingTime: string;
  openResultTime: string;
  closeBiddingTime: string;
  closeResultTime: string;
  active: boolean;
};

type Result = {
  id: string;
  date: string;
  marketName: string;
  openPanna: string;
  jodi: string;
  closePanna: string;
};

const MarketResult = ({ marketName }: { marketName: string }) => {
    const firestore = useFirestore();
    
    // Get today's date string on every render to ensure it's always current
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const resultQuery = useMemoFirebase(
        () => firestore && today ? query(
            collection(firestore, "kalyan_results"),
            where("marketName", "==", marketName),
            where("date", "==", today)
        ) : null,
        [firestore, marketName, today]
    );

    const { data: results, isLoading } = useCollection<Result>(resultQuery);
    const result = results?.[0];
    
    const getDigit = (panna: string | undefined): string => {
        if (!panna || panna.length !== 3 || !/^\d+$/.test(panna)) return '*';
        return String(panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10);
    };

    if (isLoading) {
        return <Skeleton className="h-12 w-full mt-2 bg-white/20" />;
    }

    const isFullResult = result && result.openPanna && result.closePanna && result.jodi !== 'L';
    const isOpenResultOnly = result && result.openPanna && !result.closePanna && result.jodi !== 'L';
    const isHoliday = result && result.jodi === 'L';
    
    const openDigit = getDigit(result?.openPanna);
    const jodiToShow = isOpenResultOnly ? `${openDigit}*` : result?.jodi || '**';

    return (
        <div className="mt-2 text-center font-mono text-sm flex items-center justify-center">
            {isHoliday ? (
                 <div className="flex items-center justify-center gap-2 text-white font-bold bg-red-600/90 rounded-md px-3 py-1">
                    <span>HOLIDAY</span>
                </div>
            ) : (
                 <div className="flex items-center justify-center gap-2 text-white">
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold tracking-widest">{result?.openPanna || '***'}</span>
                    </div>
                    <div className="flex flex-col items-center rounded-md bg-white px-3 py-1 text-slate-900">
                        <span className="text-2xl font-bold tracking-wider">{jodiToShow}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold tracking-widest text-white/80">{result?.closePanna || '***'}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

const MarketCard = ({ market }: { market: Market }) => {
    const [buttonState, setButtonState] = useState({ text: "Play Now", disabled: false, loading: true });
    
    useEffect(() => {
        const parseTime = (timeStr: string) => {
            if (!timeStr) return new Date(0);
            const [hours, minutes] = timeStr.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        };
        
        const openBiddingTime = parseTime(market.openBiddingTime);
        const openResultTime = parseTime(market.openResultTime);
        const closeBiddingTime = parseTime(market.closeBiddingTime);
        const closeResultTime = parseTime(market.closeResultTime);

        const updateButtonState = () => {
            const now = new Date();
            
            if (now < openBiddingTime) {
                setButtonState({ text: "Play Now", disabled: false, loading: false });
            } 
            else if (now >= openBiddingTime && now < openResultTime) {
                setButtonState({ text: "Waiting for Open Result", disabled: true, loading: false });
            } 
            else if (now >= openResultTime && now < closeBiddingTime) {
                setButtonState({ text: "Play Now", disabled: false, loading: false });
            } 
            else if (now >= closeBiddingTime && now < closeResultTime) {
                setButtonState({ text: "Waiting for Close Results", disabled: true, loading: false });
            } 
            else { 
                setButtonState({ text: "Betting Closed", disabled: true, loading: false });
            }
        };

        updateButtonState();
        const intervalId = setInterval(updateButtonState, 60000); 

        return () => clearInterval(intervalId);
    }, [market.openBiddingTime, market.openResultTime, market.closeBiddingTime, market.closeResultTime]);
    
    return (
         <Card className={cn("flex flex-col justify-between bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0", buttonState.disabled && buttonState.text === "Betting Closed" && "opacity-60")}>
            <div>
                <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
                  <CardTitle className="text-base">{market.name}</CardTitle>
                   <div className="text-right">
                      <p className="text-xs font-semibold">{new Date().toLocaleDateString('en-GB')}</p>
                      <p className="text-xs text-white/80">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-2 text-xs text-white/80">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="font-medium w-12">Bidding:</span>
                        <span className="font-semibold text-white">{market.openBiddingTime}</span>
                        <span className="mx-1">to</span>
                        <span className="font-semibold text-white">{market.closeBiddingTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="font-medium w-12">Result:</span>
                        <span className="font-semibold text-white">{market.openResultTime}</span>
                        <span className="mx-1">to</span>
                        <span className="font-semibold text-white">{market.closeResultTime}</span>
                    </div>
                    <MarketResult marketName={market.name} />
                </CardContent>
            </div>
            <CardFooter className="p-4">
               <Button 
                    asChild={!buttonState.disabled} 
                    className="w-full" 
                    size="sm" 
                    disabled={buttonState.disabled || buttonState.loading}
                    variant={buttonState.disabled && buttonState.text !== "Play Now" ? "destructive" : "default"}
               >
                <Link 
                    href={`/play/${market.name.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-disabled={buttonState.disabled || buttonState.loading}
                    tabIndex={buttonState.disabled || buttonState.loading ? -1 : undefined}
                    onClick={(e) => { if (buttonState.disabled || buttonState.loading) e.preventDefault(); }}
                >
                    {buttonState.loading ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : buttonState.text === 'Play Now' ? (
                        <Ticket className="mr-2 h-4 w-4" />
                    ) : null}
                  {buttonState.text}
                </Link>
              </Button>
            </CardFooter>
          </Card>
    )
}

export default function MarketSelectionPage() {
    const firestore = useFirestore();
    
    const activeMarketsQuery = useMemoFirebase(
        () =>
        firestore
            ? query(collection(firestore, "markets"), where("active", "==", true))
            : null,
        [firestore]
    );
    const { data: markets, isLoading } = useCollection<Market>(activeMarketsQuery);
    
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-gradient-to-br from-blue-600 to-purple-700 border-0">
                <CardHeader className="p-4 pb-2">
                  <Skeleton className="h-5 w-3/4 bg-white/20" />
                </CardHeader>
                <CardContent className="p-4 pt-2 pb-2">
                   <Skeleton className="h-3 w-full bg-white/20" />
                   <Skeleton className="h-3 w-full mt-1 bg-white/20" />
                   <Skeleton className="h-12 w-full mt-2 bg-white/20" />
                </CardContent>
                <CardFooter className="p-4 pt-2">
                  <Skeleton className="h-8 w-full bg-white/20" />
                </CardFooter>
              </Card>
            ))
          : markets?.map((market) => (
              <MarketCard key={market.id} market={market} />
        ))}
      </div>
       {!isLoading && markets?.length === 0 && (
        <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
                No active markets found.
            </CardContent>
        </Card>
      )}
    </div>
  );
}
