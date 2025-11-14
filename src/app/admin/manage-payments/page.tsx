
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Landmark, QrCode } from "lucide-react";

export default function ManagePaymentsPage() {
    const { toast } = useToast();

    const handleUpiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "UPI Details Saved",
            description: "The UPI ID has been updated successfully.",
        });
    }

    const handleBankSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Bank Details Saved",
            description: "The bank account details have been updated successfully.",
        });
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
            <Tabs defaultValue="upi" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upi">
                        <QrCode className="mr-2 h-4 w-4" />
                        UPI Details
                    </TabsTrigger>
                    <TabsTrigger value="bank">
                        <Landmark className="mr-2 h-4 w-4" />
                        Bank Account Details
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="upi" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>UPI ID for Payments</CardTitle>
                            <CardDescription>This UPI ID will be used to generate QR codes for users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <form className="space-y-4 max-w-md" onSubmit={handleUpiSubmit}>
                                <div>
                                    <Label htmlFor="upi-id">UPI ID</Label>
                                    <Input id="upi-id" placeholder="yourname@upi" defaultValue="kalyanwinner@okhdfcbank" />
                                </div>
                                <Button type="submit">Save UPI ID</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="bank" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Bank Account for Payments</CardTitle>
                            <CardDescription>This account will be shown for bank transfer options.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <form className="space-y-4 max-w-md" onSubmit={handleBankSubmit}>
                                <div>
                                    <Label htmlFor="account-holder">Account Holder Name</Label>
                                    <Input id="account-holder" placeholder="e.g., Kalyan Winner Pvt Ltd" defaultValue="Kalyan Winner Pvt Ltd" />
                                </div>
                                <div>
                                    <Label htmlFor="account-number">Account Number</Label>
                                    <Input id="account-number" placeholder="e.g., 123456789012" defaultValue="987654321098" />
                                </div>
                                 <div>
                                    <Label htmlFor="ifsc-code">IFSC Code</Label>
                                    <Input id="ifsc-code" placeholder="e.g., HDFC0001234" defaultValue="HDFC0001234" />
                                </div>
                                <div>
                                    <Label htmlFor="bank-name">Bank Name</Label>
                                    <Input id="bank-name" placeholder="e.g., HDFC Bank" defaultValue="HDFC Bank" />
                                </div>
                                 <div>
                                    <Label htmlFor="account-type">Account Type</Label>
                                     <Select defaultValue="current">
                                        <SelectTrigger id="account-type">
                                            <SelectValue placeholder="Select account type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="current">Current</SelectItem>
                                            <SelectItem value="savings">Savings</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit">Save Bank Details</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
