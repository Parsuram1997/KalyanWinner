
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Coins, PlusCircle, Trash, Settings } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { createGameRate, deleteGameRate, updateGameRate } from "@/app/actions/rate-actions";
import { getPaymentSettings, updatePaymentSettings } from "@/app/actions/payment-settings-actions";
import { FormEvent, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";


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

export default function SettingsPage() {
    const firestore = useFirestore();

    const ratesQuery = useMemoFirebase(() => firestore ? collection(firestore, "game_rates") : null, [firestore]);
    const { data: rates, isLoading: ratesLoading } = useCollection<GameRate>(ratesQuery, { skip: !firestore });
    
    const betTypesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "bet_types"), where("status", "==", "Active")) : null, [firestore]);
    const { data: betTypes, isLoading: betTypesLoading } = useCollection<BetType>(betTypesQuery, { skip: !firestore });

    const [rateValues, setRateValues] = useState<RateValues>({});
    const [minDeposit, setMinDeposit] = useState<number | string>("");
    const [minWithdrawal, setMinWithdrawal] = useState<number | string>("");
    const [winningTaxPercentage, setWinningTaxPercentage] = useState<number | string>("");
    const [depositFeePercentage, setDepositFeePercentage] = useState<number | string>("");
    const [settingsLoading, setSettingsLoading] = useState(true);

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
    
    useEffect(() => {
        const fetchAllSettings = async () => {
            setSettingsLoading(true);
            try {
                const settings = await getPaymentSettings();
                setMinDeposit(settings?.minDeposit || "");
                setMinWithdrawal(settings?.minWithdrawal || "");
                setWinningTaxPercentage(settings?.winningTaxPercentage || "");
                setDepositFeePercentage(settings?.depositFeePercentage || "");
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not load app settings."});
            } finally {
                setSettingsLoading(false);
            }
        };
        fetchAllSettings();
    }, []);


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
        const betAmount = 10;
        const payoutAmount = parseInt(formData.get('new-payoutAmount') as string, 10);

        if (!name || isNaN(payoutAmount)) {
            toast({ variant: "destructive", title: "Missing fields", description: "Please provide a name and a valid payout amount." });
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
            title: "Saving Settings...",
        });

        const updatePromises = [];
        if (rates) {
            rates.forEach(rate => {
                const currentDbRate = { betAmount: rate.betAmount, payoutAmount: rate.payoutAmount };
                const currentUiRate = rateValues[rate.id];
                if (currentUiRate && (currentDbRate.betAmount !== currentUiRate.betAmount || currentDbRate.payoutAmount !== currentUiRate.payoutAmount)) {
                    updatePromises.push(updateGameRate(rate.id, currentUiRate));
                }
            });
        }
        
        const allSettings = {
            minDeposit: Number(minDeposit) || undefined,
            minWithdrawal: Number(minWithdrawal) || undefined,
            winningTaxPercentage: Number(winningTaxPercentage) || undefined,
            depositFeePercentage: Number(depositFeePercentage) || undefined,
        };
        updatePromises.push(updatePaymentSettings(allSettings));

        try {
            await Promise.all(updatePromises);
            toast({
                title: "Settings Saved",
                description: "All settings have been updated successfully.",
            });
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Failed to Save Settings",
                description: error.message || "An unexpected error occurred.",
            });
        }
    }

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6" />
                <span>App Settings</span>
            </CardTitle>
            <CardDescription className="text-white/80">Update various application settings like payout rates.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
            {/* Game Rates Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">Game Payout Rates</h3>
                    <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" className="bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/30">
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
                                    <Select name="new-name" required>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a bet type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {betTypesLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                                            betTypes?.map(betType => (
                                                <SelectItem key={betType.id} value={betType.name}>{betType.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-betAmount" className="text-right">Bet Amount</Label>
                                    <Input id="new-betAmount" name="new-betAmount" type="number" defaultValue="10" className="col-span-3" required disabled />
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
                </div>

                <div className="space-y-4">
                    {ratesLoading && Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="p-4 bg-black/20 border-white/20"><Skeleton className="h-10 w-full bg-white/20" /></Card>
                    ))}
                    {rates?.map((rate) => (
                    <Card key={rate.id} className="p-4 bg-black/20 border-white/20">
                        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                            <Label htmlFor={`rate-${rate.id}`} className="text-base font-semibold mb-2 md:mb-0 md:w-1/3 text-white">{rate.name}</Label>
                            <div className="flex flex-1 items-center gap-2">
                                <Input 
                                    id={`betAmount-${rate.id}`} 
                                    type="number"
                                    value={rateValues[rate.id]?.betAmount || ''}
                                    onChange={(e) => handleInputChange(rate.id, 'betAmount', e.target.value)}
                                    className="bg-black/30 border-white/20 text-white" 
                                    disabled
                                />
                                <span className="text-white/80">ka</span>
                                <Input 
                                    id={`payoutAmount-${rate.id}`} 
                                    type="number"
                                    value={rateValues[rate.id]?.payoutAmount || ''}
                                    onChange={(e) => handleInputChange(rate.id, 'payoutAmount', e.target.value)}
                                    className="bg-black/30 border-white/20 text-white" 
                                />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-red-500 hover:bg-red-500/10">
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
                        </div>
                    </Card>
                    ))}
                     {!ratesLoading && rates?.length === 0 && (
                        <p className="text-center text-white/80 pt-4">No game rates found. Click "Add New Rate" to get started.</p>
                    )}
                </div>
            </div>

            <Separator className="my-8 bg-white/20" />

            {/* General Wallet Settings */}
            <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">General Wallet Settings</h3>
                <div className="space-y-4">
                    {settingsLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-full bg-white/20" />
                            <Skeleton className="h-20 w-full bg-white/20" />
                            <Skeleton className="h-20 w-full bg-white/20" />
                            <Skeleton className="h-20 w-full bg-white/20" />
                        </div>
                    ) : (
                        <>
                           <Card className="p-4 bg-black/20 border-white/20">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                    <Label htmlFor="minDeposit" className="text-base font-semibold md:w-2/5 text-white">Minimum Deposit (₹)</Label>
                                    <Input 
                                        id="minDeposit"
                                        type="number"
                                        placeholder="e.g., 100"
                                        value={minDeposit}
                                        onChange={(e) => setMinDeposit(e.target.value)}
                                        className="flex-1 bg-black/30 border-white/20 text-white"
                                    />
                                </div>
                           </Card>
                           <Card className="p-4 bg-black/20 border-white/20">
                               <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                    <Label htmlFor="minWithdrawal" className="text-base font-semibold md:w-2/5 text-white">Minimum Withdrawal (₹)</Label>
                                    <Input 
                                        id="minWithdrawal"
                                        type="number"
                                        placeholder="e.g., 500"
                                        value={minWithdrawal}
                                        onChange={(e) => setMinWithdrawal(e.target.value)}
                                        className="flex-1 bg-black/30 border-white/20 text-white"
                                    />
                                </div>
                            </Card>
                             <Card className="p-4 bg-black/20 border-white/20">
                               <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                    <Label htmlFor="winningTaxPercentage" className="text-base font-semibold md:w-2/5 text-white">Winning Tax (%)</Label>
                                    <Input 
                                        id="winningTaxPercentage"
                                        type="number"
                                        placeholder="e.g., 5"
                                        value={winningTaxPercentage}
                                        onChange={(e) => setWinningTaxPercentage(e.target.value)}
                                        className="flex-1 bg-black/30 border-white/20 text-white"
                                    />
                                </div>
                            </Card>
                             <Card className="p-4 bg-black/20 border-white/20">
                               <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                    <Label htmlFor="depositFeePercentage" className="text-base font-semibold md:w-2/5 text-white">Deposit Fee (%)</Label>
                                    <Input 
                                        id="depositFeePercentage"
                                        type="number"
                                        placeholder="e.g., 2"
                                        value={depositFeePercentage}
                                        onChange={(e) => setDepositFeePercentage(e.target.value)}
                                        className="flex-1 bg-black/30 border-white/20 text-white"
                                    />
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>


            <div className="flex justify-center pt-8">
                <Button type="submit" size="lg" className="bg-white text-primary hover:bg-white/90 font-bold">
                   Save All Settings
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
