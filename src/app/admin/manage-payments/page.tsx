"use client";

import { useEffect, useState } from "react";
import { getPaymentSettings, updatePaymentSettings } from "@/app/actions/payment-settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletCards } from 'lucide-react';

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

    const renderInput = (id: keyof PaymentSettings, label: string) => (
         <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
            <Label htmlFor={id} className="sm:text-right text-white/80">{label}</Label>
            <Input
                id={id}
                name={id}
                value={settings[id] as string || ''}
                onChange={handleChange}
                className="col-span-1 sm:col-span-2 bg-black/20 border-white/20 text-white placeholder:text-white/60 focus:border-white"
            />
        </div>
    )

    return (
        <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <WalletCards className="h-6 w-6" />
                    Manage Payments
                </CardTitle>
                <CardDescription className="text-white/80">Update payment settings for UPI and bank transfers.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-full bg-white/20" />
                        <Skeleton className="h-10 w-full bg-white/20" />
                        <Skeleton className="h-10 w-full bg-white/20" />
                        <Skeleton className="h-10 w-full bg-white/20" />
                        <Skeleton className="h-10 w-full bg-white/20" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {renderInput("upiId", "UPI ID")}
                            {renderInput("bankName", "Bank Name")}
                            {renderInput("bankAccountNumber", "Account Number")}
                            {renderInput("bankAccountHolder", "Account Holder Name")}
                            {renderInput("bankIfscCode", "IFSC Code")}
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSubmitting} className="bg-white text-primary hover:bg-white/90">
                                {isSubmitting ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
