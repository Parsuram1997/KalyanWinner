
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, PlusCircle, Edit, Trash, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { createMarket, deleteMarket, updateMarket } from "@/app/actions/market-actions";
import { cn } from "@/lib/utils";

// UPDATED: Added optional rates map
type Market = {
    id: string;
    name: string;
    active: boolean;
    rates?: { [key: string]: number }; 
};

type GameRate = {
  id: string;
  name: string;
  betAmount: number;
  payoutAmount: number;
};

const MarketForm = ({ market, gameRates, onSubmit, isPending }: { market?: Market | null, gameRates: GameRate[], onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, isPending?: boolean }) => {
    return (
      <form onSubmit={onSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Name</Label>
          <Input id="name" name="name" defaultValue={market?.name || ''} className="col-span-3" required />
        </div>
        <div className="py-2">
          <p className="text-sm font-medium text-center mb-2">Market Specific Payout Rates</p>
           <p className="text-xs text-muted-foreground text-center mb-4 flex items-center justify-center gap-2"><Info className="h-4 w-4"/>Leave blank to use default rate.</p>
          <div className="grid grid-cols-2 gap-4">
            {gameRates.map((rate) => (
              <div key={rate.id} className="grid grid-cols-2 items-center gap-2">
                 <Label htmlFor={`rate-${rate.name}`} className="text-sm">{rate.name}</Label>
                 <Input 
                    id={`rate-${rate.name}`} 
                    name={`rate-${rate.name}`} 
                    type="number" 
                    placeholder={`Default: ${rate.payoutAmount}`} 
                    defaultValue={market?.rates?.[rate.name] || ''} 
                 />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </form>
    )
}

export default function ManageMarketsPage() {
  const firestore = useFirestore();
  
  const marketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "markets"), orderBy("name")) : null, [firestore]);
  const { data: markets, isLoading: isLoadingMarkets } = useCollection<Market>(marketsQuery);
  
  const ratesQuery = useMemoFirebase(() => firestore ? collection(firestore, "game_rates") : null, [firestore]);
  const { data: gameRates, isLoading: isLoadingRates } = useCollection<GameRate>(ratesQuery);

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>, marketId?: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const marketData: Partial<Market> & { name: string } = {
      name: formData.get("name") as string,
      rates: {}
    };

    gameRates?.forEach(rate => {
        const rateValue = formData.get(`rate-${rate.name}`) as string;
        if (rateValue && marketData.rates) { // Only add if value is provided
            marketData.rates[rate.name] = Number(rateValue);
        }
    });

    if (marketData.rates && Object.keys(marketData.rates).length === 0) {
        delete marketData.rates; // If no custom rates, don't save empty object
    }

    try {
        if (marketId) {
            await updateMarket(marketId, marketData);
            toast({ title: "Market Updated", description: `${marketData.name} has been updated.` });
            setEditDialogOpen(false);
        } else {
            await createMarket({ ...marketData, active: false });
            toast({ title: "Market Added", description: `${marketData.name} has been added.` });
            setAddDialogOpen(false);
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Operation Failed", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteMarket = async (marketId: string) => {
    try {
        await deleteMarket(marketId);
        toast({ title: "Market Deleted", description: "The market has been removed." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Delete Market", description: error.message });
    }
  };
  
  const toggleMarketStatus = async (market: Market) => {
    const newActiveState = !market.active;
    try {
        await updateMarket(market.id, { active: newActiveState });
        toast({ title: "Status Updated", description: `${market.name} is now ${newActiveState ? 'Active' : 'Inactive'}.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Update Status", description: error.message });
    }
  }

  const openEditDialog = (market: Market) => {
    setSelectedMarket(market);
    setEditDialogOpen(true);
  }
  
  const isLoading = isLoadingMarkets || isLoadingRates;

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Store className="h-6 w-6" /><span>Manage Markets</span></CardTitle>
            <CardDescription className="text-white/80">Add, edit, or set custom payout rates for game markets.</CardDescription>
          </div>
           <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto shrink-0 bg-white text-primary hover:bg-white/90" disabled={isLoadingRates}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {isLoadingRates ? 'Loading Rates...' : 'Add Market'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Market</DialogTitle>
                    <DialogDescription>Enter the market name and set any custom payout rates.</DialogDescription>
                  </DialogHeader>
                  {gameRates && <MarketForm gameRates={gameRates} onSubmit={(e) => handleFormSubmit(e)} isPending={isSubmitting} />}
                </DialogContent>
              </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/20 text-sm">
            <Table>
              <TableHeader className="border-b border-white/20">
                <TableRow>
                  <TableHead className="text-white">Market Name</TableHead>
                  <TableHead className="text-white">Custom Rates</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-white/80">Loading data...</TableCell></TableRow>
                ) : markets?.map((market) => (
                  <TableRow key={market.id} className="border-white/20">
                    <TableCell className="font-medium py-2">{market.name}</TableCell>
                    <TableCell className="py-2">
                        {market.rates && Object.keys(market.rates).length > 0 
                            ? <Badge className="bg-yellow-400/20 text-yellow-300 border border-yellow-400">Yes</Badge> 
                            : <Badge className="bg-gray-400/20 text-gray-300 border border-gray-400">No</Badge>}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={!!market.active} onCheckedChange={() => toggleMarketStatus(market)} />
                        <Badge className={cn("text-xs", market.active ? "bg-green-400/20 text-green-300 border border-green-400" : "bg-red-400/20 text-red-300 border border-red-400")}>
                          {market.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="flex gap-2 justify-end py-2">
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(market)} className="bg-transparent text-white hover:bg-white/10"><Edit className="h-4 w-4" /></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete the '{market.name}' market.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMarket(market.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Market</DialogTitle>
            <DialogDescription>Update details for {selectedMarket?.name}.</DialogDescription>
          </DialogHeader>
          {gameRates && <MarketForm market={selectedMarket} gameRates={gameRates} onSubmit={(e) => handleFormSubmit(e, selectedMarket?.id)} isPending={isSubmitting} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
