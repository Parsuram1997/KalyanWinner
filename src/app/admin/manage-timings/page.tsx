
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, PlusCircle, Trash2, Pencil, Save } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useMemo, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const formSchema = z.object({
  name: z.string().optional(),
  newName: z.string().optional(),
  openBiddingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  openResultTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  closeBiddingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  closeResultTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
}).refine(data => editingMarket || data.name || data.newName, {
  message: "Market name is required. Please select one or enter a new name.",
  path: ["name"],
});


type Market = {
  id: string;
  name: string;
  openBiddingTime: string;
  openResultTime: string;
  closeBiddingTime: string;
  closeResultTime: string;
};

let editingMarket: Market | null = null;

export default function ManageTimingsPage() {
  const firestore = useFirestore();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [marketNamesFromDb, setMarketNamesFromDb] = useState<string[]>([]);

  const marketsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "markets"), where("status", "==", "Active")) : null),
    [firestore]
  );
  const { data: markets, isLoading } = useCollection<Market>(marketsQuery, { skip: !firestore });
  
  useEffect(() => {
    if (markets) {
      const names = [...new Set(markets.map(market => market.name))].sort();
      setMarketNamesFromDb(names);
    }
  }, [markets]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        newName: "",
        openBiddingTime: "00:00",
        openResultTime: "00:00",
        closeBiddingTime: "00:00",
        closeResultTime: "00:00"
    }
  });
  
  const selectedMarketName = watch("name");

  useEffect(() => {
    if (editingMarket) {
        reset(editingMarket);
    } else {
        reset({ name: "", newName: "", openBiddingTime: "00:00", openResultTime: "00:00", closeBiddingTime: "00:00", closeResultTime: "00:00" });
    }
  }, [editingMarket, reset]);


  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    const finalName = data.newName || data.name;

    if (!finalName) {
        toast({ variant: "destructive", title: "Validation Error", description: "Market name is required." });
        return;
    }

    const submissionData = {
        name: finalName,
        openBiddingTime: data.openBiddingTime,
        openResultTime: data.openResultTime,
        closeBiddingTime: data.closeBiddingTime,
        closeResultTime: data.closeResultTime,
    };

    try {
      if (editingMarket) {
        const marketDocRef = doc(firestore, "markets", editingMarket.id);
        await updateDoc(marketDocRef, submissionData);
        toast({ title: "Market Updated", description: `${submissionData.name} has been updated.` });
      } else {
        await addDoc(collection(firestore, "markets"), { ...submissionData, status: "Active" });
        toast({ title: "Market Added", description: `${submissionData.name} has been added.` });
      }
      setDialogOpen(false);
    } catch (e: any) {
      console.error("Error writing document: ", e);
      toast({ variant: "destructive", title: "Operation Failed", description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "markets", id));
      toast({ title: "Market Deleted", description: "The market has been removed." });
    } catch (e: any) {
      console.error("Error deleting document: ", e);
      toast({ variant: "destructive", title: "Delete Failed", description: e.message });
    }
  };

  const handleEdit = (market: Market) => {
    editingMarket = market;
    reset(market);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    editingMarket = null;
    reset({ name: "", newName: "", openBiddingTime: "00:00", openResultTime: "00:00", closeBiddingTime: "00:00", closeResultTime: "00:00" });
    setDialogOpen(true);
  }
  
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
              <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              <span>Market Schedule</span>
              </CardTitle>
              <CardDescription>All timings are in 24-hour format (IST).</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add/Edit Timings
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingMarket ? "Edit Market" : "Add New Market"}</DialogTitle>
                    <DialogDescription>
                    {editingMarket ? "Update the details of the market." : "Enter the details of the new market."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="name">Market Name</Label>
                       <Select onValueChange={(value) => setValue('name', value)} value={selectedMarketName}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select an existing market" />
                          </SelectTrigger>
                          <SelectContent>
                              {marketNamesFromDb.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
                    </div>

                     <div className="space-y-2 col-span-2">
                      <Label htmlFor="newName">Or Add New Market Name</Label>
                      <Input
                        id="newName"
                        {...register("newName")}
                        placeholder="Type a new market name here"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="openBiddingTime">Open Bidding</Label>
                      <Input id="openBiddingTime" type="time" {...register("openBiddingTime")} />
                      {errors.openBiddingTime && <p className="text-sm text-red-500">{errors.openBiddingTime.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="openResultTime">Open Result</Label>
                      <Input id="openResultTime" type="time" {...register("openResultTime")} />
                      {errors.openResultTime && <p className="text-sm text-red-500">{errors.openResultTime.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="closeBiddingTime">Close Bidding</Label>
                      <Input id="closeBiddingTime" type="time" {...register("closeBiddingTime")} />
                      {errors.closeBiddingTime && <p className="text-sm text-red-500">{errors.closeBiddingTime.message as string}</p>}
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="closeResultTime">Close Result</Label>
                      <Input id="closeResultTime" type="time" {...register("closeResultTime")} />
                      {errors.closeResultTime && <p className="text-sm text-red-500">{errors.closeResultTime.message as string}</p>}
                    </div>
                  </div>
                  <DialogFooter>
                      <Button type="submit">
                          {editingMarket ? <><Save className="mr-2 h-4 w-4" /> Update Market</> : <><PlusCircle className="mr-2 h-4 w-4" /> Add Market</>}
                      </Button>
                  </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-auto py-0 px-1">Market Name</TableHead>
                  <TableHead className="text-center text-xs h-auto py-0 px-1">Open Bidding</TableHead>
                  <TableHead className="text-center text-xs h-auto py-0 px-1">Open Result</TableHead>
                  <TableHead className="text-center text-xs h-auto py-0 px-1">Close Bidding</TableHead>
                  <TableHead className="text-center text-xs h-auto py-0 px-1">Close Result</TableHead>
                  <TableHead className="text-right text-xs h-auto py-0 px-1">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-0 px-1">Loading timings...</TableCell>
                  </TableRow>
                ) : markets?.map((market) => (
                  <TableRow key={market.id}>
                    <TableCell className="font-medium text-xs py-0 px-1">{market.name}</TableCell>
                    <TableCell className="text-center font-semibold text-primary text-xs py-0 px-1">{market.openBiddingTime}</TableCell>
                    <TableCell className="text-center font-semibold text-primary text-xs py-0 px-1">{market.openResultTime}</TableCell>
                    <TableCell className="text-center font-semibold text-destructive text-xs py-0 px-1">{market.closeBiddingTime}</TableCell>
                    <TableCell className="text-center font-semibold text-destructive text-xs py-0 px-1">{market.closeResultTime}</TableCell>
                    <TableCell className="text-right py-0 px-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(market)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the <strong>{market.name}</strong> market.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(market.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && markets?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-0 px-1">No active markets found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    