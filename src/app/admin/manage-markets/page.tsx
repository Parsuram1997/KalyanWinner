
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
import { useToast } from "@/hooks/use-toast";
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
import { collection } from "firebase/firestore";
import { createMarket, deleteMarket, updateMarket } from "@/app/actions/market-actions";

type Market = {
    id: string;
    name: string;
    openTime: string;
    closeTime: string;
    status: "Active" | "Inactive";
};

export default function ManageMarketsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const marketsQuery = useMemoFirebase(() => firestore ? collection(firestore, "markets") : null, [firestore]);
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
      openTime: formData.get("openTime") as string,
      closeTime: formData.get("closeTime") as string,
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
      openTime: formData.get("openTime") as string,
      closeTime: formData.get("closeTime") as string,
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
    const newStatus = market.status === "Active" ? "Inactive" : "Active";
    try {
        await updateMarket(market.id, { status: newStatus });
        toast({ title: "Status Updated", description: `${market.name} is now ${newStatus}.` });
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
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <span>Manage Markets</span>
            </CardTitle>
            <CardDescription>
              Add, edit, or remove game markets and their timings.
            </CardDescription>
          </div>
           <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Market
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Market</DialogTitle>
                    <DialogDescription>
                      Fill in the details for the new market.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddMarket} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" name="name" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="openTime" className="text-right">Open Time</Label>
                      <Input id="openTime" name="openTime" type="time" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="closeTime" className="text-right">Close Time</Label>
                      <Input id="closeTime" name="closeTime" type="time" className="col-span-3" required />
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
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market Name</TableHead>
                  <TableHead>Open Time</TableHead>
                  <TableHead>Close Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading markets...</TableCell>
                    </TableRow>
                ) : markets?.map((market) => (
                  <TableRow key={market.id}>
                    <TableCell className="font-medium">{market.name}</TableCell>
                    <TableCell>{market.openTime}</TableCell>
                    <TableCell>{market.closeTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={market.status === "Active"}
                          onCheckedChange={() => toggleMarketStatus(market)}
                          aria-label={`Toggle ${market.name} status`}
                        />
                        <Badge variant={market.status === "Active" ? "secondary" : "outline"}>
                          {market.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="flex gap-2 justify-end">
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(market)}><Edit className="h-4 w-4" /></Button>
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
            {isLoading ? <p className="text-center text-muted-foreground">Loading markets...</p> : 
              markets?.map((market) => (
                <Card key={market.id}>
                  <CardHeader>
                      <div className="flex justify-between items-start">
                          <CardTitle>{market.name}</CardTitle>
                          <Badge variant={market.status === "Active" ? "secondary" : "outline"}>
                              {market.status}
                          </Badge>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Open Time:</span>
                          <span className="font-medium">{market.openTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Close Time:</span>
                          <span className="font-medium">{market.closeTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Switch
                            checked={market.status === "Active"}
                            onCheckedChange={() => toggleMarketStatus(market)}
                            aria-label={`Toggle ${market.name} status`}
                          />
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                       <Button variant="outline" size="sm" onClick={() => openEditDialog(market)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
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
              Update the details for {selectedMarket?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMarket} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input id="edit-name" name="name" defaultValue={selectedMarket?.name} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-openTime" className="text-right">Open Time</Label>
              <Input id="edit-openTime" name="openTime" defaultValue={selectedMarket?.openTime} type="time" className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-closeTime" className="text-right">Close Time</Label>
              <Input id="edit-closeTime" name="closeTime" defaultValue={selectedMarket?.closeTime} type="time" className="col-span-3" required />
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
