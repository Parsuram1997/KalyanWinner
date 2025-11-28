
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Wallet, Phone, MapPin, Map, Mail } from "lucide-react";
import { useParams } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function EnrollerDetailsPage() {
  const params = useParams();
  const enrollerId = params.enrollerId as string; // This is the customId now
  const firestore = useFirestore();

  // Find the enroller's document ID (auth uid) from their customId
  const enrollerQuery = useMemoFirebase(() => {
    if (!firestore || !enrollerId) return null;
    return query(collection(firestore, "users"), where("customId", "==", enrollerId));
  }, [firestore, enrollerId]);

  const { data: enrollers, isLoading: isEnrollerQueryLoading } = useCollection<any>(enrollerQuery);
  
  const enrollerDocId = enrollers?.[0]?.id; // This is the actual document ID (uid)

  const enrollerRef = useMemoFirebase(() => {
    if (!firestore || !enrollerDocId) return null;
    return doc(firestore, "users", enrollerDocId);
  }, [firestore, enrollerDocId]);
  
  const { data: enroller, isLoading: isEnrollerLoading } = useDoc<any>(enrollerRef);
  
  const enrolledUsersQuery = useMemoFirebase(() => {
    if (!firestore || !enroller || !enroller.customId) return null;
    return query(collection(firestore, "users"), where("enrollerId", "==", enroller.customId));
  }, [firestore, enroller]);
  
  const { data: enrolledUsers, isLoading: areUsersLoading } = useCollection<any>(enrolledUsersQuery, { skip: !enroller?.customId });

  const isLoading = isEnrollerQueryLoading || isEnrollerLoading || areUsersLoading;

  if (isLoading) {
    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!enroller) {
    return <div>Enroller not found</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            <span>{enroller.name}</span>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>Enroller ID: {enroller.customId}</p>
            <p>Commission: ₹{enroller.commissionBalance || 0}</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">{enroller.mobile}</p>
            </div>
          </div>
           <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{enroller.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">State</p>
              <p className="font-medium">{enroller.state}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Map className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">District</p>
              <p className="font-medium">{enroller.district}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Users</CardTitle>
          <CardDescription>List of users enrolled by {enroller.name}.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Commission Paid?</TableHead>
                        <TableHead className="text-right">Total Deposits</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">Loading users...</TableCell>
                        </TableRow>
                    ) : enrolledUsers && enrolledUsers.length > 0 ? (
                        enrolledUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.customId}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>
                            <Badge variant={user.commissionPaid ? "secondary" : "outline"}>
                                {user.commissionPaid ? "Yes" : "No"}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right">₹{(user.totalDeposits || 0).toFixed(2)}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={4} className="text-center">No users enrolled by this enroller yet.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>

             {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
              {isLoading && <p className="text-center text-muted-foreground">Loading enrolled users...</p>}
              {!isLoading && enrolledUsers && enrolledUsers.length > 0 ? enrolledUsers.map((user) => (
                <Card key={user.id} className="p-4 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-muted-foreground">{user.customId}</p>
                    </div>
                  </div>
                  <div className="space-y-1 border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commission Paid:</span>
                       <Badge variant={user.commissionPaid ? "secondary" : "outline"} className="text-xs">
                        {user.commissionPaid ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Deposits:</span>
                      <span className="font-medium">₹{(user.totalDeposits || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              )) : (
                <p className="text-center text-muted-foreground py-8">No users enrolled by this enroller yet.</p>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    