
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import the router
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { createTransaction } from "@/app/actions/transaction-actions";
import { getPaymentSettings } from "@/app/actions/payment-actions";
import QRCode from "react-qr-code";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Copy } from "lucide-react";

const formSchema = z.object({
  amount: z.coerce.number().min(100, "Minimum deposit is ₹100"),
  utr: z.string().min(12, "UTR/Transaction ID must be at least 12 characters").max(22, "UTR is too long"),
});

type PaymentSettings = {
  upiId: string;
  payeeName: string;
};

export default function DepositPage() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize the router
  const { user, isUserLoading } = useUser();
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const result = await getPaymentSettings();
        if (result.success && result.data) {
          setPaymentSettings(result.data);
        } else {
          setErrorSettings(result.message || "Payment settings not found. Please contact support.");
        }
      } catch (error) {
        setErrorSettings("An error occurred while fetching payment details.");
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 100, utr: "" },
    mode: "onChange",
  });

  const watchedAmount = form.watch("amount");
  const numericAmount = Number(watchedAmount) || 0;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }

    try {
      const result = await createTransaction({
        userId: user.uid,
        amount: values.amount,
        type: "credit",
        status: "Pending",
        description: `Deposit via UPI`,
        utr: values.utr,
      });

      if (result.success) {
        toast({
          title: "Deposit Request Submitted",
          description: "Your request is pending verification and will be processed shortly.",
        });
        router.push("/wallet"); // Redirect to wallet page on success
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    }
  };
  
  const upiUrl = paymentSettings && numericAmount >= 100
    ? `upi://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(paymentSettings.payeeName)}&am=${numericAmount.toFixed(2)}&cu=INR`
    : "";

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
          toast({ title: "Copied!", description: `${text} copied to your clipboard.` })
      });
  }

  if (isLoadingSettings) {
    return <Skeleton className="max-w-md mx-auto h-96" />;
  }

  if (errorSettings) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>
            {errorSettings} Please ask the administrator to configure the payment settings in the admin panel.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Make a Deposit</CardTitle>
        <CardDescription>Enter an amount, scan the QR code, and submit the UTR.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Minimum ₹100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {numericAmount >= 100 && paymentSettings && (
              <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
                  <div className="p-4 bg-white rounded-md shadow-inner">
                    <QRCode value={upiUrl} size={180} />
                  </div>
                  <div className="text-center w-full">
                      <p className="font-bold text-lg">Amount: ₹{numericAmount.toLocaleString()}</p>
                      <div 
                        className="flex items-center justify-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(paymentSettings.upiId)}
                      >
                        <p className="text-xs">To: {paymentSettings.payeeName} ({paymentSettings.upiId})</p>
                        <Copy className="h-3 w-3"/>
                      </div>
                  </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="utr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UTR / UPI Transaction ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the 12-digit ID here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isUserLoading || !form.formState.isValid}>
              {form.formState.isSubmitting ? "Submitting..." : "Submit Deposit Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
