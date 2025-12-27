
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
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, PlusCircle, Edit, Trash } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { createBetType, deleteBetType, updateBetType } from "@/app/actions/bet-type-actions";
import { cn } from "@/lib/utils";

type BetType = { 
  id: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
};

const betOrder = [
    "Open Digit",
    "Close Digit",
    "Jodi",
    "Single Panna",
    "Double Panna",
    "Triple Panna",
    "Half Sangam",
    "Full Sangam",
];

export default function ManageBetTypesPage() {
  const firestore = useFirestore();

  const betTypesQuery = useMemoFirebase(() => firestore ? collection(firestore, "bet_types") : null, [firestore]);
  const { data: betTypes, isLoading } = useCollection<BetType>(betTypesQuery);

  const sortedBetTypes = useMemo(() => {
    if (!betTypes) return [];
    return [...betTypes].sort((a, b) => {
        const indexA = betOrder.indexOf(a.name);
        const indexB = betOrder.indexOf(b.name);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.name.localeCompare(b.name);
    });
  }, [betTypes]);
  
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBetType, setSelectedBetType] = useState<BetType | null>(null);

  const handleAddBetType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newBetType = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    };
    try {
        await createBetType(newBetType);
        setAddDialogOpen(false);
        toast({ title: "Bet Type Added", description: `${newBetType.name} has been added.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Add Bet Type", description: error.message });
    }
  };
  
  const handleEditBetType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBetType) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const updatedData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    };
    
    try {
        await updateBetType(selectedBetType.id, updatedData);
        setEditDialogOpen(false);
        toast({ title: "Bet Type Updated", description: `${updatedData.name} has been updated.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Update Bet Type", description: error.message });
    }
  };
  
  const handleDeleteBetType = async (betTypeId: string) => {
    try {
        await deleteBetType(betTypeId);
        toast({ title: "Bet Type Deleted", description: "The bet type has been removed." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Delete Bet Type", description: error.message });
    }
  };
  
  const toggleBetTypeStatus = async (betType: BetType) => {
    const newStatus = betType.status === "Active" ? "Inactive" : "Active";
    try {
        await updateBetType(betType.id, { status: newStatus });
        toast({ title: "Status Updated", description: `${betType.name} is now ${newStatus}.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Update Status", description: error.message });
    }
  }

  const openEditDialog = (betType: BetType) => {
    setSelectedBetType(betType);
    setEditDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              <span>Manage Bet Types</span>
            </CardTitle>
            <CardDescription className="text-white/80">
              Add, edit, or disable game types for users.
            </CardDescription>
          </div>
           <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto shrink-0 bg-white text-primary hover:bg-white/90">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Bet Type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Bet Type</DialogTitle>
                    <DialogDescription>
                      Fill in the details for the new bet type.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddBetType} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" name="name" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">Description</Label>
                      <Textarea id="description" name="description" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Bet Type</Button>
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
                  <TableHead className="text-white">Bet Type</TableHead>
                  <TableHead className="text-white">Description</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-white/80">Loading bet types...</TableCell>
                  </TableRow>
                ) : sortedBetTypes.map((betType) => (
                  <TableRow key={betType.id} className="border-white/20">
                    <TableCell className="font-medium">{betType.name}</TableCell>
                    <TableCell className="text-white/70">{betType.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={betType.status === "Active"}
                          onCheckedChange={() => toggleBetTypeStatus(betType)}
                          aria-label={`Toggle ${betType.name} status`}
                        />
                        <Badge className={cn("text-xs", betType.status === 'Active' ? "bg-green-400/20 text-green-300 border border-green-400" : "bg-red-400/20 text-red-300 border border-red-400")}>
                          {betType.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="flex gap-2 justify-end">
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(betType)} className="bg-transparent text-white hover:bg-white/10"><Edit className="h-4 w-4" /></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the '{betType.name}' bet type.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBetType(betType.id)}>Delete</AlertDialogAction>
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
              {isLoading ? <p className="text-center text-white/80 py-8">Loading...</p> : sortedBetTypes.map((betType) => (
                <Card key={betType.id} className="bg-black/20 border-white/20 text-white">
                  <CardHeader>
                      <div className="flex justify-between items-start">
                          <CardTitle>{betType.name}</CardTitle>
                           <Badge className={cn("text-xs", betType.status === 'Active' ? "bg-green-400/20 text-green-300 border border-green-400" : "bg-red-400/20 text-red-300 border border-red-400")}>
                              {betType.status}
                          </Badge>
                      </div>
                      <CardDescription className="text-white/80 pt-2">{betType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-center justify-between border-t border-white/20 pt-4">
                          <span className="text-sm text-white/80">Toggle Status</span>
                          <Switch
                            checked={betType.status === "Active"}
                            onCheckedChange={() => toggleBetTypeStatus(betType)}
                            aria-label={`Toggle ${betType.name} status`}
                          />
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t border-white/20 pt-4">
                       <Button variant="outline" size="sm" onClick={() => openEditDialog(betType)} className="bg-transparent text-white hover:bg-white/10"><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash className="h-4 w-4 mr-2"/>Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the '{betType.name}' bet type.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBetType(betType.id)}>Delete</AlertDialogAction>
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
            <DialogTitle>Edit Bet Type</DialogTitle>
            <DialogDescription>
              Update the details for {selectedBetType?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBetType} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input id="edit-name" name="name" defaultValue={selectedBetType?.name} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">Description</Label>
              <Textarea id="edit-description" name="description" defaultValue={selectedBetType?.description} className="col-span-3" required />
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
