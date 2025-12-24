
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import QRCode from 'react-qr-code';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Copy, Phone, CreditCard, ChevronRight, Landmark } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type PaymentSettings = {
  upiId?: string;
  payeeName?: string;
  minDeposit?: number;
  depositFeePercentage?: number;
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
};

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.75 13.96c.25.13.43.2.5.33.07.13.07.55.02.68-.05.13-.3.35-.6.5-.3.15-.68.2-1.13.1-1.1-.23-2.13-.6-3.3-1.23-1.45-.78-2.5-1.8-3.25-3.03-.24-.4-.38-.8-.38-1.23s.12-.8.36-1.04c.24-.24.5-.3.7-.3.07 0 .13.02.2.02.13.02.2.02.3.07.1.05.15.2.2.33.05.13.07.28.07.4 0 .13-.02.28-.07.4-.05.13-.1.2-.15.25l-.2.25c-.05.05-.07.1-.07.13s.02.13.07.2c.05.07.28.48.7.93.7.73 1.28 1.02 1.5.96.05-.02.1-.05.13-.07l.2-.2c.05-.05.1-.1.15-.15s.13-.07.2-.07a.3.3 0 0 1 .28.07c.1.07.48.24.58.28.1.04.18.07.2.1.04.05.04.1.02.15-.02.05-.02.1-.07.13-.05.05-.1.1-.15.15zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
    </svg>
);

export default function DepositPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const minDepositAmount = paymentSettings?.minDeposit || 100;

  const formSchema = z.object({
    amount: z.coerce.number().min(minDepositAmount, `Minimum deposit is ₹${minDepositAmount}`),
    utr: z.string().min(12, "UTR/Transaction ID must be at least 12 characters").max(22, "UTR is too long"),
  });
  
  type FormSchemaType = z.infer<typeof formSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: minDepositAmount, utr: "" },
    mode: "onChange",
  });

  useEffect(() => {
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
            minDeposit: settings.minDeposit,
            depositFeePercentage: settings.depositFeePercentage,
            bankAccountHolder: settings.bankAccountHolder,
            bankAccountNumber: settings.bankAccountNumber,
            bankIfscCode: settings.bankIfscCode,
            bankName: settings.bankName
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
  const depositFee = paymentSettings?.depositFeePercentage ? (numericAmount * paymentSettings.depositFeePercentage) / 100 : 0;
  const netDepositAmount = numericAmount - depositFee;

  const onSubmit = async (values: FormSchemaType) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    try {
      const description = `Deposit of ₹${values.amount} with a ₹${depositFee.toFixed(2)} fee.`;
      const result = await createTransaction({
        userId: user.uid,
        userName: user.displayName || 'Unknown',
        amount: values.amount,
        type: 'Deposit',
        status: "Pending",
        description: description,
        utr: values.utr,
      });

      if (result.success) {
        toast({
          title: "Deposit Request Submitted",
          description: "Your request is pending verification and will be processed shortly.",
        });
        router.push("/wallet");
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

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copied!", description: `${fieldName} copied to your clipboard.` })
    });
  }

  const handleNextStep = () => {
    form.trigger("amount").then(isValid => {
        if (isValid) {
            setCurrentStep(2);
        } else {
            toast({ variant: "destructive", title: "Invalid Amount", description: `Please enter an amount of at least ₹${minDepositAmount}.` });
        }
    });
  }

  const defaultWhatsappMessage = "Hello, I need help regarding my transaction.";
  const whatsappUrl = !isMobile 
    ? `https://web.whatsapp.com/send?phone=919406453098&text=${encodeURIComponent(defaultWhatsappMessage)}`
    : `https://wa.me/919406453098?text=${encodeURIComponent(defaultWhatsappMessage)}`;

  if (isLoadingSettings) {
    return <Skeleton className="w-full h-96 bg-slate-800" />;
  }

  if (errorSettings) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>
            {errorSettings} Please ask the administrator to configure the payment settings in the admin panel.
        </AlertDescription>
      </Alert>
    );
  }

  const hasUpiDetails = !!paymentSettings?.upiId;
  const hasBankDetails = !!paymentSettings?.bankAccountNumber;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Card className={cn("bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0 transition-opacity duration-300", currentStep === 2 && "opacity-60")}>
            <CardHeader>
              <CardTitle>Step 1: Make Payment</CardTitle>
              <CardDescription className="text-white/80">Enter amount and choose a payment method below.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount to Deposit</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={`Minimum ₹${minDepositAmount}`} {...field} disabled={currentStep > 1} className="bg-transparent text-white"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {numericAmount >= minDepositAmount && (
                    <div className="text-xs space-y-2 rounded-lg bg-black/20 p-3">
                        <div className="flex justify-between">
                            <span className="text-white/80">Deposit Fee ({paymentSettings?.depositFeePercentage || 0}%):</span>
                            <span className="font-medium">₹{depositFee.toFixed(2)}</span>
                        </div>
                        <Separator className="bg-white/30" />
                        <div className="flex justify-between font-bold">
                            <span>You Will Get:</span>
                            <span className="text-green-300">₹{netDepositAmount.toFixed(2)}</span>
                        </div>
                    </div>
                )}


                {numericAmount >= minDepositAmount && (hasUpiDetails || hasBankDetails) && (
                    <Tabs defaultValue={hasUpiDetails ? "upi" : "bank"} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-black/20">
                           {hasUpiDetails && <TabsTrigger value="upi" className="data-[state=active]:bg-white data-[state=active]:text-black">UPI</TabsTrigger>}
                           {hasUpiDetails && <TabsTrigger value="qr" className="data-[state=active]:bg-white data-[state=active]:text-black">QR</TabsTrigger>}
                           {hasBankDetails && <TabsTrigger value="bank" className="data-[state=active]:bg-white data-[state=active]:text-black">Bank</TabsTrigger>}
                        </TabsList>
                        {hasUpiDetails && (
                            <TabsContent value="upi" className="mt-4">
                               <div className="flex flex-col items-center gap-4 p-4 bg-black/20 rounded-lg">
                                <div className="text-center w-full">
                                    <p className="font-bold text-lg">Amount: ₹{numericAmount.toLocaleString()}</p>
                                    <div
                                    className="flex items-center justify-center gap-2 cursor-pointer text-white/80 hover:text-white"
                                    onClick={() => copyToClipboard(paymentSettings.upiId!, 'UPI ID')}
                                    >
                                    <p className="text-xs">To: {paymentSettings.payeeName} ({paymentSettings.upiId})</p>
                                    <Copy className="h-3 w-3" />
                                    </div>
                                </div>
                                <Button asChild className="w-full mt-2" type="button" disabled={currentStep > 1}>
                                    <a href={upiUrl}>
                                        <CreditCard className="mr-2 h-4 w-4"/> Pay with UPI
                                    </a>
                                </Button>
                                </div>
                            </TabsContent>
                        )}
                        {hasUpiDetails && (
                            <TabsContent value="qr" className="mt-4">
                                <div className="flex flex-col items-center gap-4 p-4 bg-black/20 rounded-lg">
                                  <p className="text-sm text-white/80">Scan with any UPI app</p>
                                  <div className="p-2 bg-white rounded-md shadow-inner">
                                    <QRCode
                                      value={upiUrl}
                                      size={180}
                                      level={'H'}
                                    />
                                  </div>
                                  <div className="text-center w-full">
                                      <p className="font-bold text-lg">Amount: ₹{numericAmount.toLocaleString()}</p>
                                      <p className="text-xs text-white/80">To: {paymentSettings.payeeName}</p>
                                  </div>
                                </div>
                            </TabsContent>
                        )}
                        {hasBankDetails && (
                            <TabsContent value="bank" className="mt-4">
                                 <div className="space-y-4 p-4 bg-black/20 rounded-lg text-sm">
                                    <h3 className="font-semibold text-center mb-2">Bank Account Details</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/80">Account Name:</span>
                                        <div className="flex items-center gap-2 font-medium">
                                            <span>{paymentSettings.bankAccountHolder}</span>
                                            <Copy className="h-4 w-4 cursor-pointer" onClick={() => copyToClipboard(paymentSettings.bankAccountHolder!, 'Account Name')} />
                                        </div>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <span className="text-white/80">Account Number:</span>
                                         <div className="flex items-center gap-2 font-medium">
                                            <span>{paymentSettings.bankAccountNumber}</span>
                                            <Copy className="h-4 w-4 cursor-pointer" onClick={() => copyToClipboard(paymentSettings.bankAccountNumber!, 'Account Number')} />
                                        </div>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <span className="text-white/80">IFSC Code:</span>
                                         <div className="flex items-center gap-2 font-medium">
                                            <span>{paymentSettings.bankIfscCode}</span>
                                            <Copy className="h-4 w-4 cursor-pointer" onClick={() => copyToClipboard(paymentSettings.bankIfscCode!, 'IFSC Code')} />
                                        </div>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <span className="text-white/80">Bank Name:</span>
                                         <div className="flex items-center gap-2 font-medium">
                                            <span>{paymentSettings.bankName}</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                )}
              </div>
            </CardContent>
          </Card>

          {currentStep === 1 && (
            <div className="flex justify-center">
                <Button size="lg" type="button" onClick={handleNextStep}>
                    Next: Confirm Payment <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          )}

          {currentStep === 2 && (
            <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0 animate-in fade-in-0 duration-500">
                <CardHeader>
                <CardTitle>Step 2: Confirm Deposit</CardTitle>
                <CardDescription className="text-white/80">Enter the UTR/Transaction ID from your payment app to confirm.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="utr"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>UTR / Transaction ID</FormLabel>
                        <FormControl>
                        <Input placeholder="Enter 12-digit UTR" {...field} autoFocus className="bg-transparent text-white"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting || isUserLoading || !form.formState.isValid}
                >
                    {form.formState.isSubmitting ? "Submitting..." : "Submit Deposit Request"}
                </Button>
                </CardContent>
            </Card>
          )}

        </form>
      </Form>

      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription className="text-white/80">If you have any issues with your deposit, please contact us.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-row justify-center gap-4">
            <Button asChild size="sm" variant="outline" className="bg-transparent text-white hover:bg-white/10">
              <Link href="tel:9406453098">
                  <Phone className="mr-2 h-4 w-4" /> Call Us
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="bg-transparent text-white hover:bg-white/10">
              <Link href={whatsappUrl} target="_blank">
                  <WhatsAppIcon /> <span className="ml-2">WhatsApp Us</span>
              </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
