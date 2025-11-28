
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import the router
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { createTransaction } from "@/app/actions/transaction-actions";
import { getPaymentSettings } from "@/app/actions/payment-settings-actions";
import QRCode from "react-qr-code";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Copy, Phone, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type PaymentSettings = {
  upiId?: string;
  payeeName?: string;
  minDeposit?: number;
};

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.75 13.96c.25.13.43.2.5.33.07.13.07.55.02.68-.05.13-.3.35-.6.5-.3.15-.68.2-1.13.1-1.1-.23-2.13-.6-3.3-1.23-1.45-.78-2.5-1.8-3.25-3.03-.24-.4-.38-.8-.38-1.23s.12-.8.36-1.04c.24-.24.5-.3.7-.3.07 0 .13.02.2.02.13.02.2.02.3.07.1.05.15.2.2.33.05.13.07.28.07.4 0 .13-.02.28-.07.4-.05.13-.1.2-.15.25l-.2.25c-.05.05-.07.1-.07.13s.02.13.07.2c.05.07.28.48.7.93.7.73 1.28 1.02 1.5.96.05-.02.1-.05.13-.07l.2-.2c.05-.05.1-.1.15-.15s.13-.07.2-.07a.3.3 0 0 1 .28.07c.1.07.48.24.58.28.1.04.18.07.2.1.04.05.04.1.02.15-.02.05-.02.1-.07.13-.05.05-.1.1-.15.15zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
    </svg>
);


export default function DepositPage() {
  const router = useRouter(); // Initialize the router
  const { user, isUserLoading } = useUser();
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const minDepositAmount = paymentSettings?.minDeposit || 100;

  const formSchema = z.object({
    amount: z.coerce.number().min(minDepositAmount, `Minimum deposit is ₹${minDepositAmount}`),
    utr: z.string().min(12, "UTR/Transaction ID must be at least 12 characters").max(22, "UTR is too long"),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: minDepositAmount, utr: "" },
    mode: "onChange",
  });
  
  useEffect(() => {
    // This runs only on the client, after the component has mounted.
    // It safely checks the window width to determine if it's a mobile device.
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const settings = await getPaymentSettings();
        if (settings) {
          setPaymentSettings({ 
            upiId: settings.upiId, 
            payeeName: settings.bankAccountHolder || 'Kalyan Winner',
            minDeposit: settings.minDeposit
          });
           if(settings.minDeposit) {
            form.setValue("amount", settings.minDeposit);
          }
        } else {
          setErrorSettings("Payment settings not found. Please contact support.");
        }
      } catch (error) {
        setErrorSettings("An error occurred while fetching payment details.");
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [form]);

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
        userName: user.displayName || 'Unknown',
        amount: values.amount,
        type: 'Deposit',
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
  
  const upiUrl = paymentSettings?.upiId && numericAmount >= minDepositAmount
    ? `upi://pay?pa=${paymentSettings.upiId}&am=${numericAmount.toFixed(2)}&cu=INR`
    : "";

  const copyToClipboard = (text: string) => {
      if (!text) return;
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

  const defaultWhatsappMessage = "Hello, I need help regarding my transaction.";
  const whatsappUrl = !isMobile 
    ? `https://web.whatsapp.com/send?phone=919406453098&text=${encodeURIComponent(defaultWhatsappMessage)}`
    : `https://wa.me/919406453098?text=${encodeURIComponent(defaultWhatsappMessage)}`;


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Make a Deposit</CardTitle>
          <CardDescription>Follow the steps below to add funds to your wallet.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Step 1 */}
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-lg font-bold">Step 1: Enter Amount</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder={`Minimum ₹${minDepositAmount}`} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {/* Step 2 */}
                {numericAmount >= minDepositAmount && paymentSettings?.upiId && (
                    <div className="space-y-4">
                        <Label className="text-lg font-bold">Step 2: Make Payment</Label>
                        <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg">
                            {!isMobile && (
                                <>
                                <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
                                <div className="p-4 bg-white rounded-md shadow-inner">
                                    <QRCode value={upiUrl} size={180} />
                                </div>
                                </>
                            )}
                            
                            <div className="text-center w-full">
                                <p className="font-bold text-lg">Amount: ₹{numericAmount.toLocaleString()}</p>
                                <div 
                                    className="flex items-center justify-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
                                    onClick={() => copyToClipboard(paymentSettings.upiId!)}
                                >
                                    <p className="text-xs">To: {paymentSettings.payeeName} ({paymentSettings.upiId})</p>
                                    <Copy className="h-3 w-3" />
                                </div>
                            </div>

                            {isMobile && (
                                <Button asChild className="w-full mt-2">
                                    <a href={upiUrl}>
                                        <CreditCard /> Pay with UPI
                                    </a>
                                </Button>
                            )}
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                If one UPI app fails, please try another one like GPay, Paytm, etc.
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 3 */}
                <FormField
                control={form.control}
                name="utr"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-lg font-bold">Step 3: Submit UTR</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter UTR / Transaction ID here" {...field} />
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

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>If you have any issues with your deposit, please contact us.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-row justify-center gap-4">
            <Button asChild size="xs">
              <Link href="tel:9406453098">
                  <Phone /> Call Us
              </Link>
            </Button>
            <Button asChild size="xs">
              <Link href={whatsappUrl} target="_blank">
                  <WhatsAppIcon /> WhatsApp Us
              </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
