
"use client";
import { useState, useMemo } from "react";
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
import { Search } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

const ADMINS_PER_PAGE = 10;

export default function ManageAdminsPage() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const adminsQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, "users"), where("role", "==", "Admin")) : null),
    [firestore, authUser]
  );
  const { data: admins, isLoading: isAdminsLoading } = useCollection<any>(adminsQuery);
  
  const isLoading = isUserLoading || isAdminsLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAdmins = useMemo(() => {
    let filtered = admins || [];

    if (searchTerm) {
      filtered = filtered.filter(
        (admin) =>
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.mobile.includes(searchTerm)
      );
    }

    return filtered;
  }, [admins, searchTerm]);
  
  const totalPages = Math.ceil(filteredAdmins.length / ADMINS_PER_PAGE);

  const paginatedAdmins = useMemo(() => {
    const startIndex = (currentPage - 1) * ADMINS_PER_PAGE;
    const endIndex = startIndex + ADMINS_PER_PAGE;
    return filteredAdmins.slice(startIndex, endIndex);
  }, [filteredAdmins, currentPage]);


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle>Manage Admins</CardTitle>
                <CardDescription>
                    List of all administrators in the application.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-start items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or mobile..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
           {/* Desktop Table */}
          <div className="hidden md:block rounded-md border text-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">Loading admins...</TableCell>
                  </TableRow>
                )}
                {!isLoading && paginatedAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="py-2">
                      <div className="font-medium">{admin.name}</div>
                      <div className="text-muted-foreground">{admin.customId || admin.id}</div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div>{admin.email}</div>
                      <div className="text-muted-foreground">{admin.mobile}</div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div>{admin.state}</div>
                      <div className="text-muted-foreground">{admin.district}</div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant={
                          admin.status === "Active"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {admin.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                 {!isLoading && paginatedAdmins.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">No admins found.</TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
           <div className="grid gap-4 md:hidden">
            {isLoading && <p className="text-center text-muted-foreground">Loading admins...</p>}
            {!isLoading && paginatedAdmins.map((admin) => (
              <Card key={admin.id} className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{admin.name}</p>
                        <p className="text-xs text-muted-foreground">{admin.customId || admin.id}</p>
                    </div>
                    <Badge variant={admin.status === "Active" ? "secondary" : "destructive"}>
                        {admin.status}
                    </Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <div className="text-right">
                            <p>{admin.email}</p>
                            <p className="text-muted-foreground">{admin.mobile}</p>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <div className="text-right">
                           <p>{admin.state}</p>
                           <p className="text-xs text-muted-foreground">{admin.district}</p>
                        </div>
                    </div>
                </div>
              </Card>
            ))}
             {!isLoading && paginatedAdmins.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No admins found.</p>
            )}
           </div>
        </CardContent>
        {filteredAdmins.length > ADMINS_PER_PAGE && (
            <CardFooter>
            <div className="flex items-center justify-between w-full">
                <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                >
                Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
                </span>
                <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                >
                Next
                </Button>
            </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
