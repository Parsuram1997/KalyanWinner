
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coins } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { updateGameRate } from "@/app/actions/rate-actions";
import { FormEvent, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type GameRate = {
  id: string;
  name: string;
  rate: string;
};

export default function SettingsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const ratesQuery = useMemoFirebase(() => firestore ? collection(firestore, "game_rates") : null, [firestore]);
    const { data: rates, isLoading } = useCollection<GameRate>(ratesQuery);

    const [rateValues, setRateValues] = useState<{[key: string]: string}>({});

    useEffect(() => {
        if (rates) {
            const initialValues = rates.reduce((acc, rate) => {
                acc[rate.id] = rate.rate;
                return acc;
            }, {} as {[key: string]: string});
            setRateValues(initialValues);
        }
    }, [rates]);

    const handleInputChange = (id: string, value: string) => {
        setRateValues(prev => ({...prev, [id]: value}));
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        toast({
            title: "Saving Rates...",
            description: "Please wait while the rates are being updated.",
        });

        const updatePromises = Object.keys(rateValues).map(id => {
            const originalRate = rates?.find(r => r.id === id)?.rate;
            if (originalRate !== rateValues[id]) {
                return updateGameRate(id, { rate: rateValues[id] });
            }
            return Promise.resolve();
        });

        try {
            await Promise.all(updatePromises);
            toast({
                title: "Settings Saved",
                description: "The game rates have been updated successfully.",
            });
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Failed to Save Rates",
                description: error.message || "An unexpected error occurred.",
            });
        }
    }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            <span>Manage Game Rates</span>
          </CardTitle>
          <CardDescription>Update the payout rates for different game types.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            {isLoading && Array.from({ length: 7 }).map((_, index) => (
                 <div key={index} className="grid grid-cols-2 items-center gap-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            {rates?.map((rate) => (
              <div key={rate.id} className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor={`rate-${rate.id}`} className="text-base">{rate.name}</Label>
                <Input 
                    id={`rate-${rate.id}`} 
                    value={rateValues[rate.id] || ''}
                    onChange={(e) => handleInputChange(rate.id, e.target.value)}
                    className="text-base" 
                />
              </div>
            ))}
            {!isLoading && rates && (
                <div className="flex justify-center pt-4">
                    <Button type="submit">Save Changes</Button>
                </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
