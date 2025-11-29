
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, CheckCircle, UserCheck, UserX, Wallet } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
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

    const enrollerRef = useMemoFirebase(() => (authUser ? doc(firestore, "users", authUser.uid) : null), [firestore, authUser]);
    const { data: enroller, isLoading: isEnrollerLoading } = useDoc<any>(enrollerRef);
    const enrollerCustomId = enroller?.customId;


    const enrolledUsersQuery = useMemoFirebase(() => {
        if (!firestore || !authUser || !enrollerCustomId) return null;
        // Query by both customId (new) and auth UID (legacy) to fetch all enrolled users.
        return query(collection(firestore, "users"), where("enrollerId", "in", [enrollerCustomId, authUser.uid]));
    }, [firestore, authUser, enrollerCustomId]);

    const { data: enrolledUsers, isLoading: areUsersLoading } = useCollection<any>(enrolledUsersQuery, { skip: !enrollerCustomId });
    
    const activeMarketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "markets"), where("status", "==", "Active")) : null, [firestore]);
    const { data: activeMarkets, isLoading: areMarketsLoading } = useCollection<any>(activeMarketsQuery);

    const activeBetTypesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "bet_types"), where("status", "==", "Active")) : null, [firestore]);
    const { data: activeBetTypes, isLoading: areBetTypesLoading } = useCollection<any>(activeBetTypesQuery);

    const stats = useMemo(() => {
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
        }

        return {
            totalEnrolledUsers: enrolledUsers?.length.toString() || '0',
            activeUsers: enrolledUsers?.filter(u => u.status === 'Active').length.toString() || '0',
            inactiveUsers: enrolledUsers?.filter(u => u.status === 'Inactive' || u.status === 'Suspended').length.toString() || '0',
            totalActiveMarkets: activeMarkets?.length.toString() || '0',
            totalActiveBetTypes: activeBetTypes?.length.toString() || '0',
            referralBonus: formatCurrency(enroller?.commissionBalance || 0),
        }
    }, [enrolledUsers, activeMarkets, activeBetTypes, enroller]);

    const isLoading = isUserLoading || isEnrollerLoading || areUsersLoading || areMarketsLoading || areBetTypesLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard name="Total Enrolled Users" value={stats.totalEnrolledUsers} icon={Users} isLoading={isLoading} />
        <StatCard name="Total Active Users" value={stats.activeUsers} icon={UserCheck} isLoading={isLoading} />
        <StatCard name="Total Inactive Users" value={stats.inactiveUsers} icon={UserX} isLoading={isLoading} />
        <StatCard name="Total Active Markets" value={stats.totalActiveMarkets} icon={Store} isLoading={isLoading} />
        <StatCard name="Total Active Bet Types" value={stats.totalActiveBetTypes} icon={CheckCircle} isLoading={isLoading} />
        <StatCard name="Referral Bonus" value={stats.referralBonus} icon={Wallet} isLoading={isLoading} />
      </div>
    </div>
  );
}
