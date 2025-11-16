
"use client";

import { useState } from "react";
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

const initialMarkets = [
  { id: "1", name: "Kalyan Day", openTime: "04:30 PM", closeTime: "06:30 PM", status: "Active" },
  { id: "2", name: "Kalyan Night", openTime: "09:30 PM", closeTime: "11:30 PM", status: "Active" },
  { id: "3", name: "Time Bazar", openTime: "01:00 PM", closeTime: "02:00 PM", status: "Inactive" },
  { id: "4", name: "Madhur Day", openTime: "01:30 PM", closeTime: "02:30 PM", status: "Active" },
  { id: "5", name: "Milan Night", openTime: "09:15 PM", closeTime: "11:15 PM", status: "Active" },
];

type Market = typeof initialMarkets[0];

export default function ManageMarketsPage() {
  const { toast } = useToast();
  const [markets, setMarkets] = useState(initialMarkets);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const handleAddMarket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newMarket = {
      id: (markets.length + 1).toString(),
      name: formData.get("name") as string,
      openTime: formData.get("openTime") as string,
      closeTime: formData.get("closeTime") as string,
      status: "Active",
    };
    setMarkets([...markets, newMarket]);
    setAddDialogOpen(false);
    toast({ title: "Market Added", description: `${newMarket.name} has been added.` });
  };
  
  const handleEditMarket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMarket) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const updatedMarket = {
      ...selectedMarket,
      name: formData.get("name") as string,
      openTime: formData.get("openTime") as string,
      closeTime: formData.get("closeTime") as string,
    };
    setMarkets(markets.map(m => m.id === updatedMarket.id ? updatedMarket : m));
    setEditDialogOpen(false);
    toast({ title: "Market Updated", description: `${updatedMarket.name} has been updated.` });
  };
  
  const handleDeleteMarket = (marketId: string) => {
    setMarkets(markets.filter(m => m.id !== marketId));
    toast({ variant: "destructive", title: "Market Deleted", description: "The market has been removed." });
  };
  
  const toggleMarketStatus = (marketId: string) => {
    setMarkets(markets.map(m => m.id === marketId ? { ...m, status: m.status === "Active" ? "Inactive" : "Active" } : m));
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
          <div className="rounded-md border">
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
                {markets.map((market) => (
                  <TableRow key={market.id}>
                    <TableCell className="font-medium">{market.name}</TableCell>
                    <TableCell>{market.openTime}</TableCell>
                    <TableCell>{market.closeTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={market.status === "Active"}
                          onCheckedChange={() => toggleMarketStatus(market.id)}
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
