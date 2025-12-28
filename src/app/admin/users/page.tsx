
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
    // ... (rest of the function is unchanged)
  };
  
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ... (rest of the function is unchanged)
  };

  const handleDeleteUser = async (userId: string) => {
    // ... (rest of the function is unchanged)
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

    </div>
  );
}
