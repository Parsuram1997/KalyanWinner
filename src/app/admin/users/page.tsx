
"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Eye, Trash, Edit, CircleDollarSign, HandCoins, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { createUser, deleteUser, updateUser } from "@/app/actions/user-actions";
import { manualDeposit, manualWithdrawal, grantCredit } from "@/app/actions/transaction-actions";
import { getPaymentSettings } from "@/app/actions/payment-settings-actions";
import { states, districts } from "@/lib/locations";
import { cn } from "@/lib/utils";

const USERS_PER_PAGE = 10;

export default function ManageUsersPage() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const usersQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, "users"), where("role", "==", "User")) : null),
    [firestore, authUser]
  );
  const { data: users, isLoading: isUsersLoading } = useCollection<any>(usersQuery);
  
  const isLoading = isUserLoading || isUsersLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDepositDialogOpen, setDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [isCreditDialogOpen, setCreditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editState, setEditState] = useState<string | null>(null);
  const [editDistrict, setEditDistrict] = useState<string | null>(null);

  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalFee, setWithdrawalFee] = useState(0);
  const [netPayable, setNetPayable] = useState(0);
  const [withdrawalFeePercentage, setWithdrawalFeePercentage] = useState(0);

  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name);
      setEditEmail(selectedUser.email);
      const stateValue = states.find(s => s.label === selectedUser.state)?.value || null;
      setEditState(stateValue);
      if (stateValue) {
        const districtValue = districts[stateValue]?.find(d => d.label === selectedUser.district)?.value || null;
        setEditDistrict(districtValue);
      } else {
        setEditDistrict(null);
      }
    }
  }, [selectedUser]);

  useEffect(() => {
    const amount = parseFloat(withdrawalAmount);
    if (!isNaN(amount) && amount > 0) {
      const fee = (amount * withdrawalFeePercentage) / 100;
      setWithdrawalFee(fee);
      setNetPayable(amount - fee);
    } else {
      setWithdrawalFee(0);
      setNetPayable(0);
    }
  }, [withdrawalAmount, withdrawalFeePercentage]);

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ... (rest of the function is unchanged)
  };
  
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ... (rest of the function is unchanged)
  };

  const handleDeleteUser = async (userId: string) => {
    // ... (rest of the function is unchanged)
  };

  const handleManualDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const remarks = formData.get('remarks') as string;

    if (isNaN(amount) || amount <= 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid positive amount." });
        return;
    }

    try {
        const result = await manualDeposit(selectedUser.id, amount, remarks);
        if (result.success) {
            toast({ title: "Deposit Successful", description: result.message });
            setDepositDialogOpen(false);
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Deposit Failed", description: error.message });
    }
  };
  
  const handleManualWithdrawal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ... (rest of the function is unchanged)
  };

  const handleGrantCredit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('credit-amount') as string);
    const remarks = formData.get('credit-remarks') as string;

    if (isNaN(amount) || amount <= 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid positive amount." });
        return;
    }

    try {
        const result = await grantCredit(selectedUser.id, amount, remarks);
        if (result.success) {
            toast({ title: "Credit Granted", description: result.message });
            setCreditDialogOpen(false);
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Credit Grant Failed", description: error.message });
    }
  };

  const filteredUsers = useMemo(() => {
    // ... (rest of the function is unchanged)
    let filtered = users || [];
    if (filter !== "All") filtered = filtered.filter(user => user.status === filter);
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.mobile.includes(searchTerm)
      );
    }
    return filtered;
  }, [users, searchTerm, filter]);
  
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);


  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  }

  const openDepositDialog = (user: any) => {
    setSelectedUser(user);
    setDepositDialogOpen(true);
  }
  
  const openWithdrawDialog = async (user: any) => {
    // ... (rest of the function is unchanged)
  }
  
  const openCreditDialog = (user: any) => {
    setSelectedUser(user);
    setCreditDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        {/* ... CardHeader and other components ... */}
        <CardContent>
          {/* ... Search and filter UI ... */}
          <div className="hidden md:block rounded-md border border-white/20 text-xs">
            <Table>
              <TableHeader className="border-b border-white/20">
                <TableRow>{["User", "Contact", "Location", "Balance", "Status", "Actions"].map(h => <TableHead key={h} className="text-white py-2">{h}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-4">Loading users...</TableCell></TableRow> : paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/20">
                    {/* ... other cells ... */}
                    <TableCell className="py-1">
                      <div className="font-medium text-xs">{user.name}</div>
                      <div className="text-white/70 text-xs">{user.customId}</div>
                    </TableCell>
                     <TableCell className="py-1"><div className="text-xs">{user.email}</div><div className="text-white/70 text-xs">{user.mobile}</div></TableCell>
                    <TableCell className="py-1"><div className="text-xs">{user.state}</div><div className="text-white/70 text-xs">{user.district}</div></TableCell>
                    <TableCell className="text-xs py-1 font-mono">
                        <div>Total: ₹{((user.depositBalance || 0) + (user.winningBalance || 0)).toFixed(0)}</div>
                        <div className="text-red-400">Credit: ₹{(user.creditBalance || 0).toFixed(0)}</div>
                    </TableCell>
                    <TableCell className="py-1"><Badge className={cn("text-xs", user.status === 'Active' ? "bg-green-400/20 text-green-300 border border-green-400" : "bg-red-400/20 text-red-300 border border-red-400")}>{user.status}</Badge></TableCell>
                    <TableCell className="flex gap-1 py-1">
                       <Button variant="outline" size="icon" asChild className="bg-transparent text-white hover:bg-white/10"><Link href={`/admin/users/${user.customId}`}><Eye className="h-3 w-3" /></Link></Button>
                       <Button variant="outline" size="icon" onClick={() => openDepositDialog(user)} className="bg-transparent text-white hover:bg-white/10"><CircleDollarSign className="h-3 w-3" /></Button>
                       <Button variant="outline" size="icon" onClick={() => openCreditDialog(user)} className="bg-transparent text-white hover:bg-white/10"><CreditCard className="h-3 w-3" /></Button>
                       <Button variant="outline" size="icon" onClick={() => openWithdrawDialog(user)} className="bg-transparent text-white hover:bg-white/10"><HandCoins className="h-3 w-3" /></Button>
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(user)} className="bg-transparent text-white hover:bg-white/10"><Edit className="h-3 w-3" /></Button>
                       <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash className="h-3 w-3" /></Button></AlertDialogTrigger><AlertDialogContent> {/* ... */}</AlertDialogContent></AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* ... Mobile view ... */}
        </CardContent>
        {/* ... CardFooter ... */}
      </Card>
      
      {/* ... Other Dialogs ... */}

      <Dialog open={isCreditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Grant Credit to {selectedUser?.name}</DialogTitle>
                <DialogDescription>
                    Grant credit to this user. The amount will be added to their deposit balance.
                </DialogDescription>
            </DialogHeader>
            <div className="text-sm">
                Current Credit Balance: <span className="font-bold text-lg">₹{selectedUser?.creditBalance?.toFixed(2) || '0.00'}</span>
            </div>
            <form onSubmit={handleGrantCredit} className="grid gap-4 pt-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="credit-amount" className="text-right">Amount (₹)</Label>
                    <Input id="credit-amount" name="credit-amount" type="number" className="col-span-3" required min="1" placeholder="Enter amount to grant" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="credit-remarks" className="text-right">Remarks</Label>
                    <Input id="credit-remarks" name="credit-remarks" className="col-span-3" placeholder="e.g., Special occasion credit" />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit">Grant Credit</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
