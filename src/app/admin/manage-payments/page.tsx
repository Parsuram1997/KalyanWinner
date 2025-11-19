
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getPaymentSettings, updatePaymentSettings } from "@/app/actions/payment-actions";
import { useEffect, useState, FormEvent } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// A simpler type for just the UPI settings
type UpiSettings = {
    upiId: string;
    payeeName: string;
}

export default function ManagePaymentsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<UpiSettings>({ upiId: '', payeeName: '' });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch existing settings on component mount
    useEffect(() => {
        async function fetchSettings() {
            setIsLoading(true);
            try {
                const result = await getPaymentSettings();
                if (result.success && result.data) {
                    setSettings(result.data);
                } else if (!result.success) {
                    // Don't show an error if settings just aren't configured yet
                    if (result.message !== "Payment settings have not been configured in the admin panel.") {
                         toast({ variant: "destructive", title: "Failed to load settings", description: result.message });
                    }
                }
            } catch (error) {
                toast({ variant: "destructive", title: "An unexpected error occurred" });
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, [toast]);

    // Handle the form submission
    const handleSettingsUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await updatePaymentSettings(settings);
            if (result.success) {
                toast({
                    title: "Settings Saved",
                    description: result.message,
                });
            } else {
                throw new Error(result.message);
            }
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

    // Update state on input change
    const handleChange = (key: keyof UpiSettings, value: string) => {
        setSettings(prev => ({...prev, [key]: value}));
    }

  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Manage UPI Payments</CardTitle>
          <CardDescription>
            This UPI ID and Payee Name will be used to generate QR codes for user deposits.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSettingsUpdate}>
                {isLoading ? (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <Skeleton className="h-10 w-1/3 mt-4" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="payee-name">Payee Name</Label>
                            <Input 
                                id="payee-name" 
                                placeholder="e.g., Your Company Name" 
                                value={settings.payeeName || ''} 
                                onChange={(e) => handleChange('payeeName', e.target.value)} 
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="upi-id">UPI ID</Label>
                            <Input 
                                id="upi-id" 
                                placeholder="yourname@ybl" 
                                value={settings.upiId || ''} 
                                onChange={(e) => handleChange('upiId', e.target.value)} 
                                required
                            />
                        </div>
                         <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save UPI Details"}</Button>
                    </div>
                )}
            </form>
        </CardContent>
      </Card>
  );
}
