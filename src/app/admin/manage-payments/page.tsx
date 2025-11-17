
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Landmark, QrCode } from "lucide-react";
import { getPaymentSettings, updatePaymentSettings } from "@/app/actions/payment-settings-actions";
import { useEffect, useState, FormEvent } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentSettings = {
    upiId?: string;
    bankAccountHolder?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankName?: string;
    bankAccountType?: 'Current' | 'Savings';
}

export default function ManagePaymentsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PaymentSettings>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            setIsLoading(true);
            try {
                const currentSettings = await getPaymentSettings();
                setSettings(currentSettings || {});
            } catch (error) {
                toast({ variant: "destructive", title: "Failed to load settings" });
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, [toast]);

    const handleSettingsUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updatePaymentSettings(settings);
            toast({
                title: "Settings Saved",
                description: "The payment details have been updated successfully.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to save settings",
                description: error.message || "An unknown error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleChange = (key: keyof PaymentSettings, value: string) => {
        setSettings(prev => ({...prev, [key]: value}));
    }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Payment Details</CardTitle>
          <CardDescription>
            Update the UPI and Bank Account details for receiving payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSettingsUpdate}>
                <Tabs defaultValue="upi" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upi">
                            <QrCode className="mr-2 h-4 w-4" />
                            UPI Details
                        </TabsTrigger>
                        <TabsTrigger value="bank">
                            <Landmark className="mr-2 h-4 w-4" />
                            Bank Details
                        </TabsTrigger>
                    </TabsList>
                    {isLoading ? (
                        <div className="mt-6 space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-1/4" />
                        </div>
                    ) : (
                    <>
                        <TabsContent value="upi" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>UPI ID for Payments</CardTitle>
                                    <CardDescription>This UPI ID will be used to generate QR codes for users.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 max-w-md">
                                    <div>
                                        <Label htmlFor="upi-id">UPI ID</Label>
                                        <Input id="upi-id" placeholder="yourname@upi" value={settings.upiId || ''} onChange={(e) => handleChange('upiId', e.target.value)} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="bank" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bank Account for Payments</CardTitle>
                                    <CardDescription>This account will be shown for bank transfer options.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 max-w-md">
                                    <div>
                                        <Label htmlFor="account-holder">Account Holder Name</Label>
                                        <Input id="account-holder" placeholder="e.g., Kalyan Winner Pvt Ltd" value={settings.bankAccountHolder || ''} onChange={(e) => handleChange('bankAccountHolder', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="account-number">Account Number</Label>
                                        <Input id="account-number" placeholder="e.g., 123456789012" value={settings.bankAccountNumber || ''} onChange={(e) => handleChange('bankAccountNumber', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="ifsc-code">IFSC Code</Label>
                                        <Input id="ifsc-code" placeholder="e.g., HDFC0001234" value={settings.bankIfscCode || ''} onChange={(e) => handleChange('bankIfscCode', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="bank-name">Bank Name</Label>
                                        <Input id="bank-name" placeholder="e.g., HDFC Bank" value={settings.bankName || ''} onChange={(e) => handleChange('bankName', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="account-type">Account Type</Label>
                                        <Select value={settings.bankAccountType || ''} onValueChange={(value) => handleChange('bankAccountType', value)}>
                                            <SelectTrigger id="account-type">
                                                <SelectValue placeholder="Select account type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Current">Current</SelectItem>
                                                <SelectItem value="Savings">Savings</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </>
                    )}
                </Tabs>
                <div className="mt-6 flex justify-start">
                    <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save All Details"}</Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
