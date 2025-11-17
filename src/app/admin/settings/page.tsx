
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coins, PlusCircle, Trash } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { createGameRate, deleteGameRate, updateGameRate } from "@/app/actions/rate-actions";
import { FormEvent, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type GameRate = {
  id: string;
  name: string;
  betAmount: number;
  payoutAmount: number;
};

type RateValues = {
    [key: string]: {
        betAmount: number;
        payoutAmount: number;
    }
}

export default function SettingsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const ratesQuery = useMemoFirebase(() => firestore ? collection(firestore, "game_rates") : null, [firestore]);
    const { data: rates, isLoading } = useCollection<GameRate>(ratesQuery);

    const [rateValues, setRateValues] = useState<RateValues>({});
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);

    useEffect(() => {
        if (rates) {
            const initialValues = rates.reduce((acc, rate) => {
                acc[rate.id] = { betAmount: rate.betAmount, payoutAmount: rate.payoutAmount };
                return acc;
            }, {} as RateValues);
            setRateValues(initialValues);
        }
    }, [rates]);

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

    const handleAddRate = async (e: FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('new-name') as string;
        const betAmount = parseInt(formData.get('new-betAmount') as string, 10);
        const payoutAmount = parseInt(formData.get('new-payoutAmount') as string, 10);

        if (!name || isNaN(betAmount) || isNaN(payoutAmount)) {
            toast({ variant: "destructive", title: "Missing fields", description: "Please provide name and valid amounts." });
            return;
        }

        try {
            await createGameRate({ name, betAmount, payoutAmount });
            toast({ title: "Rate Added", description: "The new game rate has been added." });
            setAddDialogOpen(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to Add Rate", description: error.message });
        }
    }
    
    const handleDeleteRate = async (rateId: string) => {
        try {
            await deleteGameRate(rateId);
            toast({ title: "Rate Deleted", description: "The game rate has been removed." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to Delete Rate", description: error.message });
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        toast({
            title: "Saving Rates...",
            description: "Please wait while the rates are being updated.",
        });

        if (!rates) return;

        const updatePromises = rates.map(rate => {
            const currentDbRate = { betAmount: rate.betAmount, payoutAmount: rate.payoutAmount };
            const currentUiRate = rateValues[rate.id];
            if (currentDbRate.betAmount !== currentUiRate.betAmount || currentDbRate.payoutAmount !== currentUiRate.payoutAmount) {
                return updateGameRate(rate.id, currentUiRate);
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
        <CardHeader className="flex flex-row justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Coins className="h-6 w-6" />
                    <span>Manage Game Rates</span>
                </CardTitle>
                <CardDescription>Update the payout rates for different game types.</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Rate
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Game Rate</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddRate} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-name" className="text-right">Name</Label>
                            <Input id="new-name" name="new-name" placeholder="e.g., Single Digit" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-betAmount" className="text-right">Bet Amount</Label>
                            <Input id="new-betAmount" name="new-betAmount" type="number" placeholder="e.g., 10" className="col-span-3" required />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-payoutAmount" className="text-right">Payout Amount</Label>
                            <Input id="new-payoutAmount" name="new-payoutAmount" type="number" placeholder="e.g., 950" className="col-span-3" required />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Add Rate</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            {isLoading && Array.from({ length: 7 }).map((_, index) => (
                 <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] items-center gap-4">
                    <Skeleton className="h-6 w-32 col-span-1" />
                    <Skeleton className="h-10 w-full col-span-2" />
                </div>
            ))}
            {rates?.map((rate) => (
              <div key={rate.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] items-center gap-4">
                <Label htmlFor={`rate-${rate.id}`} className="text-base text-left md:text-right">{rate.name}</Label>
                <Input 
                    id={`betAmount-${rate.id}`} 
                    type="number"
                    value={rateValues[rate.id]?.betAmount || 0}
                    onChange={(e) => handleInputChange(rate.id, 'betAmount', e.target.value)}
                    className="text-base" 
                />
                 <Input 
                    id={`payoutAmount-${rate.id}`} 
                    type="number"
                    value={rateValues[rate.id]?.payoutAmount || 0}
                    onChange={(e) => handleInputChange(rate.id, 'payoutAmount', e.target.value)}
                    className="text-base" 
                />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Trash className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the '{rate.name}' game rate.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteRate(rate.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {!isLoading && rates && (
                <div className="flex justify-center pt-4">
                    <Button type="submit">Save All Changes</Button>
                </div>
            )}
            {!isLoading && rates?.length === 0 && (
                <p className="text-center text-muted-foreground pt-8">
                    No game rates found. Click "Add New Rate" to get started.
                </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
