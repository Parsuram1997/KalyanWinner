
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
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Market name is required"),
  openBiddingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  openResultTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  closeBiddingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  closeResultTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

type Market = {
  id: string;
  name: string;
  openBiddingTime: string;
  openResultTime: string;
  closeBiddingTime: string;
  closeResultTime: string;
};

export default function ManageTimingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);

  const marketsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "markets") : null),
    [firestore]
  );
  const { data: markets, isLoading } = useCollection<Market>(marketsQuery, { skip: !firestore });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        openBiddingTime: "",
        openResultTime: "",
        closeBiddingTime: "",
        closeResultTime: ""
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      if (editingMarket) {
        const marketDocRef = doc(firestore, "markets", editingMarket.id);
        await updateDoc(marketDocRef, data);
        toast({ title: "Market Updated", description: `${data.name} has been updated.` });
        setEditingMarket(null);
      } else {
        await addDoc(collection(firestore, "markets"), { ...data, status: "Active" });
        toast({ title: "Market Added", description: `${data.name} has been added.` });
      }
      reset({ name: "", openBiddingTime: "", openResultTime: "", closeBiddingTime: "", closeResultTime: "" });
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
    setEditingMarket(market);
    reset(market);
  };

  const handleCancelEdit = () => {
    setEditingMarket(null);
    reset({ name: "", openBiddingTime: "", openResultTime: "", closeBiddingTime: "", closeResultTime: "" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Manage Timings</h1>
        <p className="text-muted-foreground">
          Add, update, or remove market bidding and result timings.
        </p>
      </div>
      <div className="grid grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>{editingMarket ? "Edit Market" : "Add New Market"}</CardTitle>
            <CardDescription>
              {editingMarket ? "Update the details of the market." : "Enter the details of the new market."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Market Name</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
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
              <div className="flex items-center gap-2 pt-4">
                  <Button type="submit" className="w-full md:w-auto">
                      {editingMarket ? <><Save className="mr-2 h-4 w-4" /> Update Market</> : <><PlusCircle className="mr-2 h-4 w-4" /> Add Market</>}
                  </Button>
                  {editingMarket && (
                      <Button type="button" variant="outline" className="w-full md:w-auto" onClick={handleCancelEdit}>
                          Cancel
                      </Button>
                  )}
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              <span>Market Schedule</span>
            </CardTitle>
            <CardDescription>All timings are in 24-hour format (IST).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market Name</TableHead>
                    <TableHead className="text-center">Open Bidding</TableHead>
                    <TableHead className="text-center">Open Result</TableHead>
                    <TableHead className="text-center">Close Bidding</TableHead>
                    <TableHead className="text-center">Close Result</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading timings...</TableCell>
                    </TableRow>
                  ) : markets?.map((market) => (
                    <TableRow key={market.id}>
                      <TableCell className="font-medium">{market.name}</TableCell>
                      <TableCell className="text-center font-semibold text-primary">{market.openBiddingTime}</TableCell>
                      <TableCell className="text-center font-semibold text-primary">{market.openResultTime}</TableCell>
                      <TableCell className="text-center font-semibold text-destructive">{market.closeBiddingTime}</TableCell>
                      <TableCell className="text-center font-semibold text-destructive">{market.closeResultTime}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(market)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(market.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && markets?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">No active markets found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    