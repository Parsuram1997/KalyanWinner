
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Coins } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { upsertGameRate } from "@/app/actions/rate-actions";
import { FormEvent, useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type GameRate = {
  id: string;
  name: string;
  betAmount: number;
  payoutAmount: number;
};

type BetType = {
    id: string;
    name: string;
};

type RateValues = {
    [key: string]: {
        betAmount: number;
        payoutAmount: number;
    }
}

export default function ManagePayoutsPage() {
    const firestore = useFirestore();

    const ratesQuery = useMemoFirebase(() => firestore ? collection(firestore, "game_rates") : null, [firestore]);
    const { data: rates, isLoading: ratesLoading } = useCollection<GameRate>(ratesQuery);
    
    const betTypesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "bet_types"), where("status", "==", "Active")) : null, [firestore]);
    const { data: betTypes, isLoading: betTypesLoading } = useCollection<BetType>(betTypesQuery);

    const [rateValues, setRateValues] = useState<RateValues>({});

    const unifiedRates = useMemo(() => {
        if (!betTypes) return [];
        return betTypes.map(bt => {
            const existingRate = rates?.find(r => r.name === bt.name);
            return {
                id: bt.id, // Use bet type ID as the key
                name: bt.name,
                betAmount: existingRate?.betAmount ?? 10, // Default or existing
                payoutAmount: existingRate?.payoutAmount ?? 0, // Default or existing
                isNew: !existingRate
            };
        });
    }, [betTypes, rates]);

    useEffect(() => {
        if (unifiedRates) {
            const initialValues = unifiedRates.reduce((acc, rate) => {
                acc[rate.id] = { betAmount: rate.betAmount, payoutAmount: rate.payoutAmount };
                return acc;
            }, {} as RateValues);
            setRateValues(initialValues);
        }
    }, [unifiedRates]);

    const handleInputChange = (id: string, field: 'betAmount' | 'payoutAmount', value: string) => {
        const numValue = parseInt(value, 10) || 0;
        setRateValues(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: numValue
            }
        }));
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        toast({ title: "Saving Payouts..." });

        const upsertPromises = unifiedRates.map(rate => {
            const currentVal = rateValues[rate.id];
            // Check if there is a change before creating a promise
            if (currentVal && (currentVal.betAmount !== rate.betAmount || currentVal.payoutAmount !== rate.payoutAmount)) {
                return upsertGameRate({
                    name: rate.name,
                    betAmount: currentVal.betAmount,
                    payoutAmount: currentVal.payoutAmount
                });
            }
            return Promise.resolve(null); // No changes, resolve immediately
        });

        try {
            await Promise.all(upsertPromises.filter(p => p !== null)); // Filter out null promises
            toast({ title: "Payouts Saved", description: "All payout rates have been updated successfully." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error Saving Payouts", description: error.message });
        }
    }

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Coins className="h-6 w-6" />
                <span>Manage Payouts</span>
            </CardTitle>
            <CardDescription className="text-white/80">Set the payout amount for each active bet type. Default bet is ₹10.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
            <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">Game Payout Rates</h3>
                <div className="space-y-4">
                    {(ratesLoading || betTypesLoading) && Array.from({ length: 5 }).map((_, index) => (
                        <Card key={index} className="p-4 bg-black/20 border-white/20"><Skeleton className="h-10 w-full bg-white/20" /></Card>
                    ))}
                    {unifiedRates.map((rate) => (
                    <Card key={rate.id} className="p-4 bg-black/20 border-white/20">
                        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                            <Label htmlFor={`payoutAmount-${rate.id}`} className="text-base font-semibold mb-2 md:mb-0 md:w-1/3 text-white">{rate.name}</Label>
                            <div className="flex flex-1 items-center gap-2">
                                <Input 
                                    id={`betAmount-${rate.id}`} 
                                    type="number"
                                    value={rateValues[rate.id]?.betAmount || 10}
                                    onChange={(e) => handleInputChange(rate.id, 'betAmount', e.target.value)}
                                    className="bg-black/30 border-white/20 text-white" 
                                    disabled // Bet amount is fixed
                                />
                                <span className="text-white/80">ka</span>
                                <Input 
                                    id={`payoutAmount-${rate.id}`} 
                                    type="number"
                                    value={rateValues[rate.id]?.payoutAmount || ''}
                                    onChange={(e) => handleInputChange(rate.id, 'payoutAmount', e.target.value)}
                                    className="bg-black/30 border-white/20 text-white" 
                                    placeholder="Enter payout amount"
                                />
                            </div>
                        </div>
                    </Card>
                    ))}
                     {!(ratesLoading || betTypesLoading) && unifiedRates.length === 0 && (
                        <p className="text-center text-white/80 pt-4">No active bet types found. Please activate bet types in 'Manage Bet Types' to set payouts.</p>
                    )}
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <Button type="submit" size="lg" className="bg-white text-primary hover:bg-white/90 font-bold" disabled={ratesLoading || betTypesLoading}>
                   Save Payout Settings
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
