
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { updateUserPaymentDetails } from "@/app/actions/user-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";


const bankSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  accountNumber: z.string().min(9, "Enter a valid account number"),
  ifscCode: z.string().length(11, "IFSC code must be 11 characters"),
});

const upiSchema = z.object({
  upiId: z.string().min(3, "Enter a valid UPI ID").regex(/@/, "Invalid UPI ID format"),
});


export default function BankDetailsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, "users", user.uid) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const bankForm = useForm<z.infer<typeof bankSchema>>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
    },
  });

  const upiForm = useForm<z.infer<typeof upiSchema>>({
    resolver: zodResolver(upiSchema),
    defaultValues: {
      upiId: "",
    },
  });

  useEffect(() => {
    if (userData) {
      bankForm.reset({
        bankName: userData.bankName || "",
        accountHolderName: userData.accountHolderName || "",
        accountNumber: userData.accountNumber || "",
        ifscCode: userData.ifscCode || "",
      });
      upiForm.reset({
        upiId: userData.upiId || "",
      });
    }
  }, [userData, bankForm, upiForm]);


  const handleBankDetailsSubmit = async (values: z.infer<typeof bankSchema>) => {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in" });
      return;
    }
    try {
      await updateUserPaymentDetails({
        userId: user.uid,
        paymentMethod: 'bank',
        ...values
      });
      toast({ title: "Bank details updated successfully" });
      router.push('/wallet/withdraw');
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to update bank details", description: (error as Error).message });
    }
  };

  const handleUpiSubmit = async (values: z.infer<typeof upiSchema>) => {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in" });
      return;
    }
    try {
      await updateUserPaymentDetails({ userId: user.uid, paymentMethod: 'upi', ...values });
      toast({ title: "UPI ID updated successfully" });
      router.push('/wallet/withdraw');
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to update UPI ID", description: (error as Error).message });
    }
  };

  const isLoading = isUserLoading || isUserDataLoading;
  const isBankSubmitting = bankForm.formState.isSubmitting;
  const isUpiSubmitting = upiForm.formState.isSubmitting;

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Manage your bank account details and UPI ID for payments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Tabs defaultValue={userData?.paymentMethod || 'bank'} className="p-4 sm:p-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bank">Bank Account</TabsTrigger>
              <TabsTrigger value="upi">UPI</TabsTrigger>
            </TabsList>
            <TabsContent value="bank" className="mt-4">
              <Form {...bankForm}>
                <form onSubmit={bankForm.handleSubmit(handleBankDetailsSubmit)} className="space-y-4">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={bankForm.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankForm.control}
                        name="accountHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Holder Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankForm.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankForm.control}
                        name="ifscCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IFSC Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  <Button type="submit" disabled={isBankSubmitting || isLoading}>
                    {isBankSubmitting ? "Saving..." : "Save Bank Details"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="upi" className="mt-4">
              <Form {...upiForm}>
                <form onSubmit={upiForm.handleSubmit(handleUpiSubmit)} className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <FormField
                      control={upiForm.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UPI ID</FormLabel>
                          <FormControl>
                             <Input {...field} placeholder="yourname@upi" />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" disabled={isUpiSubmitting || isLoading}>
                    {isUpiSubmitting ? "Saving..." : "Save UPI ID"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
