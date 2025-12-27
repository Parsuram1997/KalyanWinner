 
"use client";

import { useEffect, useState } from "react";
import { getPaymentSettings, updatePaymentSettings } from "@/app/actions/payment-settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletCards, TrendingUp, TrendingDown, Landmark, Banknote } from 'lucide-react';

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
    depositFeePercentage?: number;
    withdrawalFeePercentage?: number;
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
        const isFee = name.includes('FeePercentage');
        const parsedValue = isFee ? value : parseInt(value, 10);

        setSettings(prev => ({ ...prev, [name]: isNaN(parsedValue as number) && !isFee ? '' : parsedValue }));
    };

    const renderInput = (id: keyof PaymentSettings, label: string, icon?: React.ReactNode, type = "text") => (
         <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
            <Label htmlFor={id} className="sm:text-right flex items-center gap-2 text-white/80">
                {icon} {label}
            </Label>
            <Input
                id={id}
                name={id}
                type={type}
                value={settings[id] as any || ''}
                onChange={handleChange}
                className="col-span-1 sm:col-span-2 bg-black/20 border-white/20 text-white placeholder:text-white/60 focus:border-white"
                step={type === "number" ? "0.01" : undefined}
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
                <CardDescription className="text-white/80">Update global payment settings, transaction limits, and fees.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-6">
                        {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-white/10" />)}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4 p-4 border border-white/20 rounded-lg bg-black/10">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><Landmark className="h-5 w-5 text-blue-400"/>UPI & Bank Details</h3>
                            {renderInput("upiId", "UPI ID")}
                            {renderInput("bankName", "Bank Name")}
                            {renderInput("bankAccountNumber", "Account Number")}
                            {renderInput("bankAccountHolder", "Account Holder Name")}
                            {renderInput("bankIfscCode", "IFSC Code")}
                        </div>
                         <div className="space-y-4 p-4 border border-white/20 rounded-lg bg-black/10">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><Banknote className="h-5 w-5 text-purple-400"/>Transaction Limits</h3>
                            {renderInput("minDeposit", "Minimum Deposit (₹)", undefined, "number")}
                            {renderInput("minWithdrawal", "Minimum Withdrawal (₹)", undefined, "number")}
                        </div>
                        <div className="space-y-4 p-4 border border-white/20 rounded-lg bg-black/10">
                            <h3 className="text-lg font-semibold flex items-center gap-2">Fee Settings</h3>
                            {renderInput("depositFeePercentage", "Deposit Fee (%)", <TrendingDown className="h-4 w-4 text-green-400" />, "number")}
                            {renderInput("withdrawalFeePercentage", "Withdrawal Fee (%)", <TrendingUp className="h-4 w-4 text-red-400" />, "number")}
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSubmitting} size="lg" className="bg-white text-primary hover:bg-white/90 font-bold">
                                {isSubmitting ? 'Saving...' : 'Save All Settings'}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
