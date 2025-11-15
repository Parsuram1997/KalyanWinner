"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

const states = [
  { "value": "AN", "label": "Andaman and Nicobar Islands" },
  { "value": "AP", "label": "Andhra Pradesh" },
  { "value": "AR", "label": "Arunachal Pradesh" },
  { "value": "AS", "label": "Assam" },
  { "value": "BR", "label": "Bihar" },
  { "value": "CG", "label": "Chandigarh" },
  { "value": "CH", "label": "Chhattisgarh" },
  { "value": "DH", "label": "Dadra and Nagar Haveli" },
  { "value": "DD", "label": "Daman and Diu" },
  { "value": "DL", "label": "Delhi" },
  { "value": "GA", "label": "Goa" },
  { "value": "GJ", "label": "Gujarat" },
  { "value": "HR", "label": "Haryana" },
  { "value": "HP", "label": "Himachal Pradesh" },
  { "value": "JK", "label": "Jammu and Kashmir" },
  { "value": "JH", "label": "Jharkhand" },
  { "value": "KA", "label": "Karnataka" },
  { "value": "KL", "label": "Kerala" },
  { "value": "LD", "label": "Lakshadweep" },
  { "value": "MP", "label": "Madhya Pradesh" },
  { "value": "MH", "label": "Maharashtra" },
  { "value": "MN", "label": "Manipur" },
  { "value": "ML", "label": "Meghalaya" },
  { "value": "MZ", "label": "Mizoram" },
  { "value": "NL", "label": "Nagaland" },
  { "value": "OR", "label": "Odisha" },
  { "value": "PY", "label": "Puducherry" },
  { "value": "PB", "label": "Punjab" },
  { "value": "RJ", "label": "Rajasthan" },
  { "value": "SK", "label": "Sikkim" },
  { "value": "TN", "label": "Tamil Nadu" },
  { "value": "TS", "label": "Telangana" },
  { "value": "TR", "label": "Tripura" },
  { "value": "UK", "label": "Uttarakhand" },
  { "value": "UP", "label": "Uttar Pradesh" },
  { "value": "WB", "label": "West Bengal" }
]

const districts: { [key: string]: { value: string, label: string }[] } = {
    AN: [
        {"value": "nicobars", "label": "Nicobars"},
        {"value": "north and middle andaman", "label": "North and Middle Andaman"},
        {"value": "south andaman", "label": "South Andaman"}
    ],
    AP: [
        {"value": "srikakulam", "label": "Srikakulam"},
        {"value": "vizianagaram", "label": "Vizianagaram"},
        {"value": "visakhapatnam", "label": "Visakhapatnam"},
        {"value": "east godavari", "label": "East Godavari"},
        {"value": "west godavari", "label": "West Godavari"},
        {"value": "krishna", "label": "Krishna"},
        {"value": "guntur", "label": "Guntur"},
        {"value": "prakasam", "label": "Prakasam"},
        {"value": "sri potti sriramulu nellore", "label": "Sri Potti Sriramulu Nellore"},
        {"value": "ysr", "label": "YSR"},
        {"value": "kurnool", "label": "Kurnool"},
        {"value": "anantapur", "label": "Anantapur"},
        {"value": "chittoor", "label": "Chittoor"}
    ],
    // Add all other states and districts here as in the admin/users page
};

export default function CreateUserPage() {
    const { toast } = useToast();
    const [selectedState, setSelectedState] = useState<string | null>(null);

    const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const name = formData.get("name") as string;
        
        toast({
            title: "User Created",
            description: `${name} has been successfully enrolled.`,
        });
        form.reset();
        setSelectedState(null);
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-6 w-6" />
                        <span>Create New User</span>
                    </CardTitle>
                    <CardDescription>
                        Fill in the details to enroll a new user. They will receive credentials to log in.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateUser} className="space-y-4 max-w-lg mx-auto">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" required />
                        </div>
                        <div>
                            <Label htmlFor="mobile">Mobile Number</Label>
                            <Input id="mobile" name="mobile" type="tel" required />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                        <div>
                            <Label htmlFor="state">State</Label>
                            <Select name="state" onValueChange={setSelectedState}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a state" />
                                </SelectTrigger>
                                <SelectContent>
                                    {states.map(state => (
                                        <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="district">District</Label>
                            <Select name="district" disabled={!selectedState}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a district" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedState && districts[selectedState] && districts[selectedState].map(district => (
                                        <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="password">Set Password</Label>
                            <Input id="password" name="password" type="text" required />
                        </div>
                        <Button type="submit" className="w-full">Create User Account</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
