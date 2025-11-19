
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
import { Textarea } from "@/components/ui/textarea";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { createBetType, deleteBetType, updateBetType } from "@/app/actions/bet-type-actions";

type BetType = { 
  id: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
};

export default function ManageBetTypesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const betTypesQuery = useMemoFirebase(() => firestore ? collection(firestore, "bet_types") : null, [firestore]);
  const { data: betTypes, isLoading } = useCollection<BetType>(betTypesQuery, { skip: !firestore });
  
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
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              <span>Manage Bet Types</span>
            </CardTitle>
            <CardDescription>
              Add, edit, or disable game types for users.
            </CardDescription>
          </div>
           <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
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
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bet Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Loading bet types...</TableCell>
                  </TableRow>
                ) : betTypes?.map((betType) => (
                  <TableRow key={betType.id}>
                    <TableCell className="font-medium">{betType.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{betType.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={betType.status === "Active"}
                          onCheckedChange={() => toggleBetTypeStatus(betType)}
                          aria-label={`Toggle ${betType.name} status`}
                        />
                        <Badge variant={betType.status === "Active" ? "secondary" : "outline"}>
                          {betType.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="flex gap-2 justify-end">
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(betType)}><Edit className="h-4 w-4" /></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the '{betType.name}' bet type.
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
              {isLoading ? <p className="text-center">Loading...</p> : betTypes?.map((betType) => (
                <Card key={betType.id}>
                  <CardHeader>
                      <div className="flex justify-between items-start">
                          <CardTitle>{betType.name}</CardTitle>
                          <Badge variant={betType.status === "Active" ? "secondary" : "outline"}>
                              {betType.status}
                          </Badge>
                      </div>
                      <CardDescription>{betType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Switch
                            checked={betType.status === "Active"}
                            onCheckedChange={() => toggleBetTypeStatus(betType)}
                            aria-label={`Toggle ${betType.name} status`}
                          />
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                       <Button variant="outline" size="sm" onClick={() => openEditDialog(betType)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash className="h-4 w-4 mr-2"/>Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the '{betType.name}' bet type.
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
