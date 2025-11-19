
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowUpCircle, Store, CheckCircle, UserCheck, UserX } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({ name, value, icon: Icon, isLoading }: { name: string; value: string; icon: React.ElementType; isLoading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">{value}</div>}
      </CardContent>
    </Card>
);

export default function EnrollerDashboardPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    const enrolledUsersQuery = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(collection(firestore, "users"), where("enrollerId", "==", authUser.uid));
    }, [firestore, authUser]);

    const { data: enrolledUsers, isLoading: areUsersLoading } = useCollection<any>(enrolledUsersQuery);
    
    const activeMarketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "markets"), where("status", "==", "Active")) : null, [firestore]);
    const { data: activeMarkets, isLoading: areMarketsLoading } = useCollection<any>(activeMarketsQuery);

    const activeBetTypesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "bet_types"), where("status", "==", "Active")) : null, [firestore]);
    const { data: activeBetTypes, isLoading: areBetTypesLoading } = useCollection<any>(activeBetTypesQuery);

    const enrolledUserIds = useMemo(() => {
        return enrolledUsers ? enrolledUsers.map(u => u.id) : [];
    }, [enrolledUsers]);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || enrolledUserIds.length === 0) return null;
        if (enrolledUserIds.length > 30) {
            console.warn("More than 30 enrolled users, deposit calculation might be incomplete.");
        }
        return query(collection(firestore, "transactions"), where('userId', 'in', enrolledUserIds.slice(0, 30)));
    }, [firestore, enrolledUserIds]);

    const { data: transactions, isLoading: areTxnsLoading } = useCollection<any>(transactionsQuery);

    const stats = useMemo(() => {
        const totalDeposits = transactions
            ?.filter(t => t.type === 'Deposit' && t.status === 'Completed')
            .reduce((sum, t) => sum + t.amount, 0) || 0;
            
        const formatCurrency = (amount: number) => {
             return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
        }

        return {
            totalEnrolledUsers: enrolledUsers?.length.toString() || '0',
            activeUsers: enrolledUsers?.filter(u => u.status === 'Active').length.toString() || '0',
            inactiveUsers: enrolledUsers?.filter(u => u.status === 'Inactive' || u.status === 'Suspended').length.toString() || '0',
            totalDeposits: formatCurrency(totalDeposits),
            totalActiveMarkets: activeMarkets?.length.toString() || '0',
            totalActiveBetTypes: activeBetTypes?.length.toString() || '0',
        }
    }, [enrolledUsers, transactions, activeMarkets, activeBetTypes]);

    const isLoading = isUserLoading || areUsersLoading || areTxnsLoading || areMarketsLoading || areBetTypesLoading;

  return (
    <div className="flex flex-col gap-6">
       <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Enroller Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your enrolled users and their activity.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard name="Total Enrolled Users" value={stats.totalEnrolledUsers} icon={Users} isLoading={isLoading} />
        <StatCard name="Total Active Users" value={stats.activeUsers} icon={UserCheck} isLoading={isLoading} />
        <StatCard name="Total Inactive Users" value={stats.inactiveUsers} icon={UserX} isLoading={isLoading} />
        <StatCard name="Total Deposits from Your Users" value={stats.totalDeposits} icon={ArrowUpCircle} isLoading={isLoading} />
        <StatCard name="Total Active Markets" value={stats.totalActiveMarkets} icon={Store} isLoading={isLoading} />
        <StatCard name="Total Active Bet Types" value={stats.totalActiveBetTypes} icon={CheckCircle} isLoading={isLoading} />
      </div>
    </div>
  );
}
