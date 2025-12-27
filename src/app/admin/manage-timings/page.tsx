
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, updateDoc, doc, query, serverTimestamp, where } from "firebase/firestore";
import { Edit, Save, Loader2, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


const marketSchema = z.object({
  name: z.string().min(1, "Market name is required."),
  openTime: z.string().min(1, "Open time is required."),
  closeTime: z.string().min(1, "Close time is required."),
  openBiddingTime: z.string().min(1, "Bidding open time is required."),
  closeBiddingTime: z.string().min(1, "Bidding close time is required."),
  closeResultTime: z.string().min(1, "Result close time is required."),
  active: z.boolean().default(true),
  days: z.object({
    monday: z.boolean().default(false),
    tuesday: z.boolean().default(false),
    wednesday: z.boolean().default(false),
    thursday: z.boolean().default(false),
    friday: z.boolean().default(false),
    saturday: z.boolean().default(false),
    sunday: z.boolean().default(false),
  }).default({ monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false }),
});

type MarketFormData = z.infer<typeof marketSchema>;

type Market = MarketFormData & {
  id: string;
};

const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export default function ManageTimingsPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const firestore = useFirestore();
  const marketsCollection = useMemo(() => firestore ? collection(firestore, "markets") : null, [firestore]);
  const marketsQuery = useMemoFirebase(
    () => (marketsCollection ? query(marketsCollection, where("active", "==", true)) : null),
    [marketsCollection]
  );
  const { data: markets, isLoading, error } = useCollection<Market>(marketsQuery);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<MarketFormData>({
    resolver: zodResolver(marketSchema),
  });

  useEffect(() => {
    if (editingMarket) {
      reset(editingMarket);
    }
  }, [editingMarket, reset]);

  const onSubmit = async (data: MarketFormData) => {
    if (!marketsCollection || !editingMarket) return;
    setSubmitting(true);
    try {
      const marketDoc = doc(firestore, "markets", editingMarket.id);
      await updateDoc(marketDoc, { ...data, updatedAt: serverTimestamp() });
      setDialogOpen(false);
      setEditingMarket(null);
    } catch (e) {
      console.error("Error updating market: ", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (market: Market) => {
    setEditingMarket(market);
    setDialogOpen(true);
  };

  const DayDisplay = ({ days }: { days: Market['days'] }) => {
    if (!days) return <span className="text-white/70">Not Set</span>;
    const activeDays = Object.entries(days)
        .filter(([_, isActive]) => isActive)
        .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3));
    if (activeDays.length === 7) return <span className="text-green-400 font-semibold">All Days</span>;
    if (activeDays.length === 0) return <span className="text-red-400">None</span>
    return <span className="text-xs">{activeDays.join(', ')}</span>;
  }

  return (
    <div className="container mx-auto p-4 text-white">
      <Card className="bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900 border-white/10">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-6 w-6"/> Manage Market Timings</CardTitle>
            <CardDescription className="text-white/70">Edit the timings and active days for all ACTIVE markets.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md my-4">
                <h4 className="font-bold flex items-center gap-2"><AlertTriangle/> An error occurred while fetching data:</h4>
                <pre className="whitespace-pre-wrap text-sm mt-2">{JSON.stringify(error, null, 2)}</pre>
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="bg-gray-950 text-white border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Timings for {editingMarket?.name}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openTime">Open Time</Label>
                    <Input id="openTime" type="time" {...register("openTime")} className="bg-gray-800 border-gray-600"/>
                    {errors.openTime && <p className="text-sm text-red-500">{errors.openTime.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closeTime">Close Time</Label>
                    <Input id="closeTime" type="time" {...register("closeTime")} className="bg-gray-800 border-gray-600"/>
                    {errors.closeTime && <p className="text-sm text-red-500">{errors.closeTime.message as string}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                    <Label className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Active Days</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        {dayNames.map(day => (
                            <div key={day} className="flex items-center space-x-2">
                                <Controller
                                    name={`days.${day}`}
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox
                                            id={`days.${day}`}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="border-gray-500 data-[state=checked]:bg-blue-600"
                                        />
                                    )}
                                />
                                <Label htmlFor={`days.${day}`} className="text-sm font-medium capitalize">{day.slice(0,3)}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                    <div className="space-y-2">
                      <Label htmlFor="openBiddingTime">Open Bidding</Label>
                      <Input id="openBiddingTime" type="time" {...register("openBiddingTime")} className="bg-gray-800 border-gray-600"/>
                      {errors.openBiddingTime && <p className="text-sm text-red-500">{errors.openBiddingTime.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="closeBiddingTime">Close Bidding</Label>
                      <Input id="closeBiddingTime" type="time" {...register("closeBiddingTime")} className="bg-gray-800 border-gray-600"/>
                      {errors.closeBiddingTime && <p className="text-sm text-red-500">{errors.closeBiddingTime.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="closeResultTime">Result Freeze</Label>
                      <Input id="closeResultTime" type="time" {...register("closeResultTime")} className="bg-gray-800 border-gray-600"/>
                      {errors.closeResultTime && <p className="text-sm text-red-500">{errors.closeResultTime.message as string}</p>}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                        {isSubmitting 
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</>
                            : <><Save className="mr-2 h-4 w-4" /> Update Timings</>
                        }
                    </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="rounded-md border border-white/20 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-white/20 hover:bg-black/20">
                  <TableHead className="text-white">Market Name</TableHead>
                  <TableHead className="text-white">Timings (Open/Close)</TableHead>
                  <TableHead className="text-white">Active Days</TableHead>
                  <TableHead className="text-white">Bidding (Open/Close)</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right text-white pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && !error && Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-b-white/20">
                    <TableCell colSpan={6} className="p-4">
                        <div className="h-8 bg-white/10 rounded w-full animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && !error && markets?.map((market) => (
                  <TableRow key={market.id} className="border-b-white/20 hover:bg-black/20">
                    <TableCell className="font-medium">{market.name}</TableCell>
                    <TableCell>{market.openTime} - {market.closeTime}</TableCell>
                    <TableCell><DayDisplay days={market.days} /></TableCell>
                    <TableCell>{market.openBiddingTime} - {market.closeBiddingTime}</TableCell>
                    <TableCell>
                      <Badge className={cn(market.active ? 'bg-green-600' : 'bg-red-600', 'text-white')}>
                        {market.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(market)} className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && !error && markets?.length === 0 && (
                  <TableRow className="border-b-white/20">
                    <TableCell colSpan={6} className="text-center text-white/70 py-8">No active markets found. Activate markets in the 'Manage Markets' page to see them here.</TableCell>
                  </TableRow>
                )}
                {!isLoading && error && (
                    <TableRow className="border-b-white/20">
                        <TableCell colSpan={6} className="text-center text-red-400 py-8">An error occurred. Please see the message above.</TableCell>
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
