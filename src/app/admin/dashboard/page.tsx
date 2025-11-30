
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, ArrowUpCircle, ArrowDownCircle, Hourglass, UserPlus, Store, Settings } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";


const StatCard = ({ name, value, subValue, icon: Icon, isLoading }: { name: string; value: string; subValue?:string; icon: React.ElementType; isLoading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-6 w-24" /> : 
        <div>
          <div className="text-xl font-bold">{value}</div>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
        }
      </CardContent>
    </Card>
);

export default function AdminDashboardPage() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, "users"), where("role", "==", "User")) : null), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<any>(usersQuery);
    
    const marketsQuery = useMemoFirebase(() => (firestore ? collection(firestore, "markets") : null), [firestore]);
    const { data: markets, isLoading: marketsLoading } = useCollection<any>(marketsQuery);
    
    const betTypesQuery = useMemoFirebase(() => (firestore ? collection(firestore, "bet_types") : null), [firestore]);
    const { data: betTypes, isLoading: betTypesLoading } = useCollection<any>(betTypesQuery);
    
    const transactionsQuery = useMemoFirebase(() => firestore ? collection(firestore, "transactions") : null, [firestore]);
    const { data: transactions, isLoading: transactionsLoading } = useCollection<any>(transactionsQuery);

    const stats = useMemo(() => {
        const allUsers = users || [];
        const allTransactions = transactions || [];
        const allMarkets = markets || [];
        const allBetTypes = betTypes || [];

        const formatCurrency = (amount: number) => {
             return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
        }

        const pendingDeposits = allTransactions.filter(t => t.type === 'Deposit' && t.status === 'Pending');
        const pendingWithdrawals = allTransactions.filter(t => t.type === 'Withdrawal' && t.status === 'Pending');

        return {
            totalUsers: allUsers.length.toString(),
            usersByAdmin: allUsers.filter(u => u.createdBy === 'Admin').length.toString(),
            usersBySelf: allUsers.filter(u => u.createdBy === 'Self' || !u.createdBy).length.toString(),
            allUserWalletBalance: formatCurrency(allUsers.reduce((sum, u) => sum + (u.depositBalance || 0) + (u.winningBalance || 0), 0)),
            totalDeposit: formatCurrency(allTransactions.filter(t => t.type === 'Deposit' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0)),
            totalWithdrawal: formatCurrency(allTransactions.filter(t => t.type === 'Withdrawal' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0)),
            pendingDepositAmount: formatCurrency(pendingDeposits.reduce((sum, t) => sum + t.amount, 0)),
            pendingDepositUsers: `${new Set(pendingDeposits.map(t => t.userId)).size} Users`,
            pendingWithdrawalAmount: formatCurrency(pendingWithdrawals.reduce((sum, t) => sum + t.amount, 0)),
            pendingWithdrawalUsers: `${new Set(pendingWithdrawals.map(t => t.userId)).size} Users`,
            totalMarkets: allMarkets.length.toString(),
            totalBetTypes: allBetTypes.length.toString(),
        }
    }, [users, transactions, markets, betTypes]);

    const isLoading = usersLoading || transactionsLoading || marketsLoading || betTypesLoading;

    const statsCards = [
      { name: "Pending Deposit", value: stats.pendingDepositAmount, subValue: stats.pendingDepositUsers, icon: Hourglass },
      { name: "Pending Withdrawals", value: stats.pendingWithdrawalAmount, subValue: stats.pendingWithdrawalUsers, icon: Wallet },
      { name: "Total Users", value: stats.totalUsers, icon: Users },
      { name: "Users by Admin", value: stats.usersByAdmin, icon: UserPlus },
      { name: "Self-Registered Users", value: stats.usersBySelf, icon: UserPlus },
      { name: "Total Markets", value: stats.totalMarkets, icon: Store },
      { name: "Total Bet Types", value: stats.totalBetTypes, icon: Settings },
      { name: "All User Wallet Balance", value: stats.allUserWalletBalance, icon: Wallet },
      { name: "Total Deposit", value: stats.totalDeposit, icon: ArrowUpCircle },
      { name: "Total Withdrawal", value: stats.totalWithdrawal, icon: ArrowDownCircle },
    ];


  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {statsCards.map((stat) => (
          <StatCard key={stat.name} name={stat.name} value={stat.value} subValue={stat.subValue} icon={stat.icon} isLoading={isLoading} />
        ))}
      </div>
    </div>
  );
}
