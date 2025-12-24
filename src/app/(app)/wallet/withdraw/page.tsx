
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { createTransaction } from "@/app/actions/transaction-actions";
import { getPaymentSettings } from "@/app/actions/payment-settings-actions";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Banknote, Landmark, Wallet, Terminal, AlertTriangle, Phone } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.75 13.96c.25.13.43.2.5.33.07.13.07.55.02.68-.05.13-.3.35-.6.5-.3.15-.68.2-1.13.1-1.1-.23-2.13-.6-3.3-1.23-1.45-.78-2.5-1.8-3.25-3.03-.24-.4-.38-.8-.38-1.23s.12-.8.36-1.04c.24-.24.5-.3.7-.3.07 0 .13.02.2.02.13.02.2.02.3.07.1.05.15.2.2.33.05.13.07.28.07.4 0 .13-.02.28-.07.4-.05.13-.1.2-.15.25l-.2.25c-.05.05-.07.1-.07.13s.02.13.07.2c.05.07.28.48.7.93.7.73 1.28 1.02 1.5.96.05-.02.1-.05.13-.07l.2-.2c.05-.05.1-.1.15-.15s.13-.07.2-.07a.3.3 0 0 1 .28.07c.1.07.48.24.58.28.1.04.18.07.2.1.04.05.04.1.02.15-.02.05-.02.1-.07.13-.05.05-.1.1-.15.15zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
    </svg>
);

export default function WithdrawPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isMobile, setIsMobile] = useState(false);
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(100);

  const formSchema = z.object({
    amount: z.coerce.number().min(minWithdrawalAmount, `Minimum withdrawal is ₹${minWithdrawalAmount}`),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: minWithdrawalAmount },
  });
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, "users", user.uid) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<any>(userDocRef);

  const winningBalance = userData?.winningBalance || 0;
  const hasPaymentDetails = userData?.paymentMethod;

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const settings = await getPaymentSettings();
            if(settings && settings.minWithdrawal) {
                setMinWithdrawalAmount(settings.minWithdrawal);
                form.reset({ amount: settings.minWithdrawal }); 
            }
        } catch (error: any) {
            toast({
              variant: "destructive",
              title: "Error fetching settings",
              description: error.message || "Could not fetch withdrawal settings."
            })
        }
    };
    fetchSettings();
  }, [form]);

  useEffect(() => {
    if (winningBalance > 0) {
      form.setValue("amount", winningBalance);
    }
  }, [winningBalance, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !userData) {
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
        userName: user.displayName || 'Unknown',
        amount: values.amount,
        type: "Withdrawal",
        status: "Pending",
        description: `Withdrawal request to ${userData.paymentMethod === 'bank' ? userData.accountNumber : userData.upiId}`,
      });

      if (result.success) {
        toast({
          title: "Withdrawal Request Submitted",
          description: "Your request is pending approval and will be processed shortly.",
        });
        form.reset();
        router.push("/wallet");
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    }
  };

  const isLoading = isUserLoading || isUserDataLoading;

  const renderPaymentDetails = () => {
    if (!userData) return null;
    
    if (userData.paymentMethod === 'bank') {
      return (
        <div className="space-y-1 text-sm text-white">
          <p className="font-semibold">{userData.accountHolderName}</p>
          <p className="text-white/80">{`A/C: ${userData.accountNumber}`}</p>
          <p className="text-white/80">{`IFSC: ${userData.ifscCode}`}</p>
        </div>
      );
    }
    if (userData.paymentMethod === 'upi') {
      return (
        <div className="space-y-1 text-sm text-white">
          <p className="font-semibold">UPI ID</p>
          <p className="text-white/80">{userData.upiId}</p>
        </div>
      );
    }
    return null;
  };

  const defaultWhatsappMessage = "Hello, I need help regarding my transaction.";
  const whatsappUrl = !isMobile 
    ? `https://web.whatsapp.com/send?phone=919406453098&text=${encodeURIComponent(defaultWhatsappMessage)}`
    : `https://wa.me/919406453098?text=${encodeURIComponent(defaultWhatsappMessage)}`;


  return (
    <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
      <CardHeader>
        <CardTitle className="text-xl">Request Withdrawal</CardTitle>
        <CardDescription className="text-white/80">You can withdraw funds from your winning balance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-black/20 text-center">
            <p className="text-sm text-white/80">Available to Withdraw</p>
            {isLoading ? 
                <Skeleton className="h-8 w-32 mx-auto mt-1 bg-white/20"/> :
                <p className="text-2xl font-bold font-mono">₹{winningBalance.toFixed(0)}</p>
            }
        </div>
        
        {isLoading ? <Skeleton className="h-24 w-full bg-white/20" /> : !hasPaymentDetails ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Payment Method Found</AlertTitle>
              <AlertDescription>
                Please add your bank or UPI details before you can request a withdrawal.
              </AlertDescription>
              <Button asChild className="mt-4" size="sm">
                  <Link href="/wallet/account">Add Payment Details</Link>
              </Button>
            </Alert>
        ) : (
          <div className="mb-4">
             <Card className="bg-black/20 border border-white/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base text-white">Withdraw To:</CardTitle>
                    <Button variant="outline" size="sm" asChild className="bg-transparent text-white hover:bg-white/10">
                       <Link href="/wallet/account">Change</Link>
                    </Button>
                </CardHeader>
                <CardContent className="pt-2">
                    {renderPaymentDetails()}
                </CardContent>
             </Card>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Withdraw (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={`e.g., ${minWithdrawalAmount}`} {...field} className="bg-transparent text-white"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading || form.formState.isSubmitting || !hasPaymentDetails}>
              {form.formState.isSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
            </Button>
          </form>
        </Form>
        <Separator className="my-4 bg-white/20" />
        <div className="text-center space-y-4 bg-black/20 p-4 rounded-lg">
          <p className="text-sm font-medium">Need help? Contact us.</p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline" className="bg-transparent text-white hover:bg-white/10">
              <Link href="tel:9406453098">
                <Phone className="mr-2" /> Call
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent text-white hover:bg-white/10">
              <Link href={whatsappUrl} target="_blank">
                <WhatsAppIcon /> <span className="ml-2">WhatsApp</span>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
