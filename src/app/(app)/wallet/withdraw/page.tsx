
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { createTransaction } from "@/app/actions/transaction-actions";
import { doc, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// 1. Zod schema for validation
const formSchema = z.object({
  amount: z.coerce.number().min(100, "Minimum withdrawal is ₹100"),
});

export default function WithdrawPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [winningBalance, setWinningBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // 2. Fetch winning balance
  const fetchWinningBalance = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoadingBalance(true);
    try {
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setWinningBalance(userDoc.data().winningBalance || 0);
      } else {
        setWinningBalance(0);
      }
    } catch (error) {
      console.error("Error fetching winning balance: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch winning balance." });
    } finally {
      setIsLoadingBalance(false);
    }
  }, [user, firestore, toast]);

  useEffect(() => {
    fetchWinningBalance();
  }, [fetchWinningBalance]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 100 },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }

    if (values.amount > winningBalance) {
        form.setError("amount", { type: "manual", message: "Withdrawal amount cannot exceed your winning balance." });
        return;
    }

    try {
      const result = await createTransaction({
        userId: user.uid,
        amount: values.amount,
        type: "debit", // 'debit' for withdrawals
        status: "Pending",
        description: `Withdrawal request`,
      });

      if (result.success) {
        toast({
          title: "Withdrawal Request Submitted",
          description: "Your request is pending approval and will be processed shortly.",
        });
        form.reset();
        fetchWinningBalance(); // Re-fetch balance after submission
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    }
  };

  const isLoading = isUserLoading || isLoadingBalance;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Request Withdrawal</CardTitle>
        <CardDescription>You can withdraw funds from your winning balance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 mb-6 rounded-lg bg-muted text-center">
            <p className="text-sm text-muted-foreground">Available to Withdraw</p>
            {isLoading ? 
                <Skeleton className="h-8 w-32 mx-auto mt-1"/> :
                <p className="text-3xl font-bold font-mono">₹{winningBalance.toLocaleString('en-IN')}</p>
            }
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Withdraw (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
