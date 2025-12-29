
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
import { PlusCircle, Search, Eye, Trash, Edit } from "lucide-react";
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
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editState, setEditState] = useState<string | null>(null);
  const [editDistrict, setEditDistrict] = useState<string | null>(null);

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

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const newUser = {
        name: formData.get("name") as string,
        mobile: formData.get("mobile") as string,
        email: formData.get("email") as string,
        state: states.find(s => s.value === (formData.get("state") as string))?.label || '',
        district: districts[formData.get("state") as string]?.find(d => d.value === (formData.get("district") as string))?.label || '',
        password: formData.get("password") as string,
        role: 'User' as 'User',
        createdBy: 'Admin' as 'Admin',
    };

    try {
        await createUser(newUser);
        setAddUserDialogOpen(false);
        toast({ title: "User Added", description: `${newUser.name} has been added.` });
        form.reset();
        setSelectedState(null);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Add User", description: error.message });
    }
  };
  
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updatedData = {
        name: editName,
        email: editEmail,
        state: states.find(s => s.value === editState)?.label || selectedUser.state,
        district: editState ? districts[editState]?.find(d => d.value === editDistrict)?.label || selectedUser.district : selectedUser.district,
    };

    try {
        await updateUser(selectedUser.id, updatedData);
        setEditDialogOpen(false);
        toast({ title: "User Updated", description: `${updatedData.name}'s details have been updated.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Update User", description: error.message });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast({ title: "User Deleted", description: "The user has been deleted." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to Delete User", description: error.message });
    }
  };

  const filteredUsers = useMemo(() => {
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

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
          <div>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription className="text-white/80">View, add, or edit user details.</CardDescription>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto shrink-0 bg-white text-primary hover:bg-white/90">
                <PlusCircle className="h-4 w-4 mr-2" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New User</DialogTitle><DialogDescription>Fill in the details to add a new user.</DialogDescription></DialogHeader>
              <form onSubmit={handleAddUser} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" name="name" className="col-span-3" required /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="mobile" className="text-right">Mobile</Label><Input id="mobile" name="mobile" type="tel" className="col-span-3" required /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email</Label><Input id="email" name="email" type="email" className="col-span-3" required /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="state" className="text-right">State</Label><Select name="state" onValueChange={setSelectedState} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a state" /></SelectTrigger><SelectContent>{states.map(state => <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="district" className="text-right">District</Label><Select name="district" disabled={!selectedState} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a district" /></SelectTrigger><SelectContent>{selectedState && districts[selectedState] && districts[selectedState].map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="password" className="text-right">Password</Label><Input id="password" name="password" type="text" className="col-span-3" required /></div>
                <DialogFooter><Button type="submit">Create User</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
              <Input placeholder="Search by name or mobile..." className="pl-8 bg-black/20 border-white/20 text-white" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </div>
            <Tabs value={filter} onValueChange={(v) => { setFilter(v); setCurrentPage(1); }} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 bg-black/20">
                <TabsTrigger value="All" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-black">All</TabsTrigger>
                <TabsTrigger value="Active" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-black">Active</TabsTrigger>
                <TabsTrigger value="Inactive" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-black">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="hidden md:block rounded-md border border-white/20 text-xs">
            <Table>
              <TableHeader className="border-b border-white/20">
                <TableRow>{["User", "Contact", "Location", "Balance", "Status", "Actions"].map(h => <TableHead key={h} className="text-white py-2">{h}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-4">Loading users...</TableCell></TableRow> : paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/20">
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
                       <Button variant="outline" size="icon" asChild className="bg-transparent text-white hover:bg-white/10 h-7 w-7"><Link href={`/admin/users/${user.customId}`}><Eye className="h-3 w-3" /></Link></Button>
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(user)} className="bg-transparent text-white hover:bg-white/10 h-7 w-7"><Edit className="h-3 w-3" /></Button>
                       <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="h-7 w-7"><Trash className="h-3 w-3" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the user '{user.name}'.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="grid gap-4 md:hidden">
            {isLoading && <p className="text-center text-white/80 py-8">Loading users...</p>}
            {!isLoading && paginatedUsers.map((user) => (
                <Card key={user.id} className="p-4 bg-black/20 border-white/20 text-white">
                    <div className="flex justify-between items-start">
                        <div><p className="font-semibold">{user.name}</p><p className="text-xs text-white/70">{user.customId}</p></div>
                        <Badge className={cn("text-xs", user.status === "Active" ? "bg-green-400/20 text-green-300 border border-green-400" : "bg-red-400/20 text-red-300 border border-red-400")}>{user.status}</Badge>
                    </div>
                    <div className="mt-4 space-y-2 text-sm border-t border-white/20 pt-3">
                        <div className="flex justify-between"><span className="text-white/70">Contact:</span><div className="text-right"><p>{user.email}</p><p>{user.mobile}</p></div></div>
                        <div className="flex justify-between"><span className="text-white/70">Location:</span><div className="text-right"><p>{user.state}</p><p className="text-xs">{user.district}</p></div></div>
                        <div className="flex justify-between font-mono"><span className="text-white/70">Balance:</span><span>₹{((user.depositBalance || 0) + (user.winningBalance || 0)).toFixed(0)}</span></div>
                        <div className="flex justify-between font-mono text-red-400"><span className="text-red-400/70">Credit:</span><span>₹{(user.creditBalance || 0).toFixed(0)}</span></div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2 border-t border-white/20 pt-3">
                        <Button variant="outline" size="sm" asChild className="bg-transparent hover:bg-white/10"><Link href={`/admin/users/${user.customId}`}><Eye className="h-4 w-4 mr-1"/> View</Link></Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)} className="bg-transparent hover:bg-white/10"><Edit className="h-4 w-4 mr-1"/> Edit</Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash className="h-4 w-4 mr-1"/> Delete</Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete '{user.name}'.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </div>
                </Card>
            ))}
          </div>

        </CardContent>
        <CardFooter className="border-t border-white/20 pt-4">
           <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="bg-transparent hover:bg-white/10">Previous</Button>
            <span className="text-sm text-white/80">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="bg-transparent hover:bg-white/10">Next</Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Update details for {selectedUser?.name}.</DialogDescription></DialogHeader>
          <form onSubmit={handleEditUser} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-name" className="text-right">Name</Label><Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" required /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-email" className="text-right">Email</Label><Input id="edit-email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" className="col-span-3" required /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-state" className="text-right">State</Label><Select name="state" value={editState || undefined} onValueChange={setEditState} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a state" /></SelectTrigger><SelectContent>{states.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-district" className="text-right">District</Label><Select name="district" value={editDistrict || undefined} onValueChange={setEditDistrict} disabled={!editState} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a district" /></SelectTrigger><SelectContent>{editState && districts[editState] && districts[editState].map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Save Changes</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
