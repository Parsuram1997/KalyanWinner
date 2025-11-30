
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, Wallet, GanttChartSquare, ArrowUpCircle, ArrowDownCircle, Hourglass, TrendingDown, UserCheck, UserX, Ban, UserPlus, Store, CheckCircle, XCircle, Settings, Shield } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
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
        {isLoading ? <Skeleton className="h-6 w-24" /> : <div className="text-xl font-bold">{value}</div>}
      </CardContent>
    </Card>
);

export default function AdminDashboardPage() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, "users"), where("role", "==", "User")) : null), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<any>(usersQuery);

    const adminsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, "users"), where("role", "==", "Admin")) : null), [firestore]);
    const { data: admins, isLoading: adminsLoading } = useCollection<any>(adminsQuery);
    
    const marketsQuery = useMemoFirebase(() => (firestore ? collection(firestore, "markets") : null), [firestore]);
    const { data: markets, isLoading: marketsLoading } = useCollection<any>(marketsQuery);
    
    const betTypesQuery = useMemoFirebase(() => (firestore ? collection(firestore, "bet_types") : null), [firestore]);
    const { data: betTypes, isLoading: betTypesLoading } = useCollection<any>(betTypesQuery);
    
    const transactionsQuery = useMemoFirebase(() => firestore ? collection(firestore, "transactions") : null, [firestore]);
    const { data: transactions, isLoading: transactionsLoading } = useCollection<any>(transactionsQuery);

    const stats = useMemo(() => {
        const allUsers = users || [];
        const allAdmins = admins || [];
        const allTransactions = transactions || [];
        const allMarkets = markets || [];
        const allBetTypes = betTypes || [];

        const formatCurrency = (amount: number) => {
             return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
        }

        return {
            totalAdmins: allAdmins.length.toString(),
            totalUsers: allUsers.length.toString(),
            usersByAdmin: allUsers.filter(u => u.createdBy === 'Admin').length.toString(),
            usersBySelf: allUsers.filter(u => u.createdBy === 'Self' || !u.createdBy).length.toString(),
            activeUsers: allUsers.filter(u => u.status === 'Active').length.toString(),
            inactiveUsers: allUsers.filter(u => u.status === 'Inactive').length.toString(),
            suspendedUsers: allUsers.filter(u => u.status === 'Suspended').length.toString(),
            totalBetsPlaced: "N/A", // Needs bets collection
            allUserWalletBalance: formatCurrency(allUsers.reduce((sum, u) => sum + (u.balance || 0), 0)),
            totalDeposit: formatCurrency(allTransactions.filter(t => t.type === 'Deposit' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0)),
            totalWithdrawal: formatCurrency(allTransactions.filter(t => t.type === 'Withdrawal' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0)),
            totalWinnings: "N/A", // Needs calculation logic
            totalLoss: "N/A", // Needs calculation logic
            pendingDeposit: allTransactions.filter(t => t.type === 'Deposit' && t.status === 'Pending').length.toString(),
            pendingWithdrawals: allTransactions.filter(t => t.type === 'Withdrawal' && t.status === 'Pending').length.toString(),
            totalMarkets: allMarkets.length.toString(),
            activeMarkets: allMarkets.filter(m => m.status === 'Active').length.toString(),
            inactiveMarkets: allMarkets.filter(m => m.status === 'Inactive').length.toString(),
            totalBetTypes: allBetTypes.length.toString(),
            activeBetTypes: allBetTypes.filter(bt => bt.status === 'Active').length.toString(),
            inactiveBetTypes: allBetTypes.filter(bt => bt.status === 'Inactive').length.toString(),
        }
    }, [users, admins, transactions, markets, betTypes]);

    const isLoading = usersLoading || adminsLoading || transactionsLoading || marketsLoading || betTypesLoading;

    const statsCards = [
      { name: "Total Admins", value: stats.totalAdmins, icon: Shield },
      { name: "Total Users", value: stats.totalUsers, icon: Users },
      { name: "Users by Admin", value: stats.usersByAdmin, icon: UserPlus },
      { name: "Self-Registered Users", value: stats.usersBySelf, icon: UserPlus },
      { name: "Active Users", value: stats.activeUsers, icon: UserCheck },
      { name: "Total Markets", value: stats.totalMarkets, icon: Store },
      { name: "Active Markets", value: stats.activeMarkets, icon: CheckCircle },
      { name: "Inactive Markets", value: stats.inactiveMarkets, icon: XCircle },
      { name: "Total Bet Types", value: stats.totalBetTypes, icon: Settings },
      { name: "Active Bet Types", value: stats.activeBetTypes, icon: CheckCircle },
      { name: "Inactive Bet Types", value: stats.inactiveBetTypes, icon: Ban },
      { name: "Inactive Users", value: stats.inactiveUsers, icon: UserX },
      { name: "Suspended Users", value: stats.suspendedUsers, icon: Ban },
      { name="Total Bets Placed", value: stats.totalBetsPlaced, icon: GanttChartSquare },
      { name: "All User Wallet Balance", value: stats.allUserWalletBalance, icon: Wallet },
      { name: "Total Deposit", value: stats.totalDeposit, icon: ArrowUpCircle },
      { name: "Total Withdrawal", value: stats.totalWithdrawal, icon: ArrowDownCircle },
      { name: "Total Winnings", value: stats.totalWinnings, icon: ClipboardList },
      { name: "Total Loss", value: stats.totalLoss, icon: TrendingDown },
      { name: "Pending Deposit", value: stats.pendingDeposit, icon: Hourglass },
      { name: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Wallet },
    ];


  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {statsCards.map((stat) => (
          <StatCard key={stat.name} name={stat.name} value={stat.value} icon={stat.icon} isLoading={isLoading} />
        ))}
      </div>
    </div>
  );
}
