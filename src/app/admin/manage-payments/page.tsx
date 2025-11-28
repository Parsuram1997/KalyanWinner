"use client";

import { useEffect, useState } from "react";
import { getPaymentSettings, updatePaymentSettings } from "@/app/actions/payment-settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentSettings {
  upiId?: string;
  payeeName?: string;
    bankAccountHolder?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankName?: string;
    bankAccountType?: 'Current' | 'Savings';
    referralBonusAmount?: number;
    minDepositForBonus?: number;
    minDeposit?: number;
    minWithdrawal?: number;
}

export default function ManagePaymentsPage() {
    const [settings, setSettings] = useState<PaymentSettings>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const currentSettings = await getPaymentSettings();
                setSettings(currentSettings || {});
            } catch (error) {
                toast({ variant: "destructive", title: "Failed to load settings" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updatePaymentSettings(settings);
            toast({ title: "Settings updated successfully" });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to update settings" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Payments</CardTitle>
                <CardDescription>Update payment settings for UPI and bank transfers.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="upiId">UPI ID</Label>
                            <Input id="upiId" name="upiId" value={settings.upiId || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input id="bankName" name="bankName" value={settings.bankName || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input id="accountNumber" name="bankAccountNumber" value={settings.bankAccountNumber || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="accountHolderName">Account Holder Name</Label>
                            <Input id="accountHolderName" name="bankAccountHolder" value={settings.bankAccountHolder || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="ifscCode">IFSC Code</Label>
                            <Input id="ifscCode" name="bankIfscCode" value={settings.bankIfscCode || ''} onChange={handleChange} />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
