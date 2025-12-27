
"use client";

import { useState, useMemo } from "react";
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
import { Store, PlusCircle, Edit, Trash } from "lucide-react";
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


type Market = {
    id: string;
    name: string;
    active: boolean;
};

export default function ManageMarketsPage() {
  const firestore = useFirestore();
  
  const marketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "markets"), orderBy("name")) : null, [firestore]);
  const { data: markets, isLoading } = useCollection<Market>(marketsQuery, { skip: !firestore });
  
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const handleAddMarket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newMarketData = {
      name: formData.get("name") as string,
      active: false,
    };
    try {
        await createMarket(newMarketData);
        setAddDialogOpen(false);
        toast({ title: "Market Added", description: `${newMarketData.name} has been added.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Add Market", description: error.message });
    }
  };
  
  const handleEditMarket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMarket) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const updatedData = {
      name: formData.get("name") as string,
    };
    
    try {
        await updateMarket(selectedMarket.id, updatedData);
        setEditDialogOpen(false);
        toast({ title: "Market Updated", description: `${updatedData.name} has been updated.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Update Market", description: error.message });
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

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <span>Manage Markets</span>
            </CardTitle>
            <CardDescription className="text-white/80">
              Add, edit, or remove game markets. Timings are managed on the 'Manage Timings' page.
            </CardDescription>
          </div>
           <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto shrink-0 bg-white text-primary hover:bg-white/90">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Market
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Market</DialogTitle>
                    <DialogDescription>
                      Enter the name for the new market.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddMarket} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" name="name" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Market</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border border-white/20 text-sm">
            <Table>
              <TableHeader className="border-b border-white/20">
                <TableRow>
                  <TableHead className="text-white">Market Name</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-white/80">Loading markets...</TableCell>
                    </TableRow>
                ) : markets?.map((market) => (
                  <TableRow key={market.id} className="border-white/20">
                    <TableCell className="font-medium py-2">{market.name}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!market.active}
                          onCheckedChange={() => toggleMarketStatus(market)}
                          aria-label={`Toggle ${market.name} status`}
                        />
                        <Badge className={cn("text-xs", market.active ? "bg-green-400/20 text-green-300 border border-green-400" : "bg-red-400/20 text-red-300 border border-red-400")}>
                          {market.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="flex gap-2 justify-end py-2">
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(market)} className="bg-transparent text-white hover:bg-white/10"><Edit className="h-4 w-4" /></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the '{market.name}' market.
                              </AlertDialogDescription>
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
          
           {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
            {isLoading ? <p className="text-center text-white/80 py-8">Loading markets...</p> : 
              markets?.map((market) => (
                <Card key={market.id} className="bg-black/20 border-white/20 text-white">
                  <CardHeader>
                      <div className="flex justify-between items-start">
                          <CardTitle>{market.name}</CardTitle>
                          <Badge className={cn("text-xs", market.active ? "bg-green-400/20 text-green-300 border border-green-400" : "bg-red-400/20 text-red-300 border border-red-400")}>
                              {market.active ? "Active" : "Inactive"}
                          </Badge>
                      </div>
                  </CardHeader>
                  <CardContent className="border-t border-white/20 pt-4">
                      <div className="flex items-center justify-between">
                          <span className="text-sm text-white/80">Toggle Status:</span>
                          <Switch
                            checked={!!market.active}
                            onCheckedChange={() => toggleMarketStatus(market)}
                            aria-label={`Toggle ${market.name} status`}
                          />
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t border-white/20 pt-4">
                       <Button variant="outline" size="sm" onClick={() => openEditDialog(market)} className="bg-transparent text-white hover:bg-white/10"><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash className="h-4 w-4 mr-2"/>Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the '{market.name}' market.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMarket(market.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
          </div>

        </CardContent>
      </Card>
      
       {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Market</DialogTitle>
            <DialogDescription>
              Update the name for {selectedMarket?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMarket} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input id="edit-name" name="name" defaultValue={selectedMarket?.name} className="col-span-3" required />
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
