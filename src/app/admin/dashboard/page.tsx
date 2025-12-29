
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, ArrowUpCircle, ArrowDownCircle, Hourglass, UserPlus, Store, Settings, TrendingUp, TrendingDown, CreditCard, Trophy, PiggyBank } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({ name, value, subValue, icon: Icon, isLoading }: { name: string; value: string; subValue?:string; icon: React.ElementType; isLoading: boolean }) => (
    <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">{name}</CardTitle>
        <Icon className="h-4 w-4 text-white/80" />
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-6 w-24 bg-white/20" /> : 
        <div>
          <div className="text-xl font-bold text-white">{value}</div>
          {subValue && <p className="text-xs text-white/80">{subValue}</p>}
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

    const paymentSettingsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'payment_settings') : null, [firestore]);
    const { data: paymentSettingsData, isLoading: paymentSettingsLoading } = useCollection<any>(paymentSettingsQuery);
    const paymentSettings = paymentSettingsData?.[0] || {};


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
        
        const completedDeposits = allTransactions.filter(t => t.type === 'Deposit' && t.status === 'Completed');
        const completedWithdrawals = allTransactions.filter(t => t.type === 'Withdrawal' && t.status === 'Completed');
        
        // Corrected Fee Calculations
        const totalDepositFee = completedDeposits.reduce((sum, t) => sum + (t.fee || 0), 0);
        
        const creditTransactions = allTransactions.filter(t => t.type === 'Credit' && t.status === 'Completed');
        const totalCreditFee = creditTransactions.reduce((sum, t) => sum + (t.fee || 0), 0);

        const totalWithdrawalFee = completedWithdrawals.reduce((sum, t) => sum + (t.fee || 0), 0);

        return {
            totalUsers: allUsers.length.toString(),
            usersByAdmin: allUsers.filter(u => u.createdBy === 'Admin').length.toString(),
            usersBySelf: allUsers.filter(u => u.createdBy === 'Self' || !u.createdBy).length.toString(),
            allUserWalletBalance: formatCurrency(allUsers.reduce((sum, u) => sum + (u.depositBalance || 0) + (u.winningBalance || 0), 0)),
            totalDepositBalance: formatCurrency(allUsers.reduce((sum, u) => sum + (u.depositBalance || 0), 0)),
            totalWinningBalance: formatCurrency(allUsers.reduce((sum, u) => sum + (u.winningBalance || 0), 0)),
            totalCreditBalance: formatCurrency(allUsers.reduce((sum, u) => sum + (u.creditBalance || 0), 0)),
            totalDeposit: formatCurrency(completedDeposits.reduce((sum, t) => sum + t.amount, 0)),
            totalWithdrawal: formatCurrency(completedWithdrawals.reduce((sum, t) => sum + t.amount, 0)),
            pendingDepositAmount: formatCurrency(pendingDeposits.reduce((sum, t) => sum + t.amount, 0)),
            pendingDepositUsers: `${new Set(pendingDeposits.map(t => t.userId)).size} Users`,
            pendingWithdrawalAmount: formatCurrency(pendingWithdrawals.reduce((sum, t) => sum + t.amount, 0)),
            pendingWithdrawalUsers: `${new Set(pendingWithdrawals.map(t => t.userId)).size} Users`,
            totalMarkets: allMarkets.length.toString(),
            totalBetTypes: allBetTypes.length.toString(),
            totalDepositFee: formatCurrency(totalDepositFee),
            totalWithdrawalFee: formatCurrency(totalWithdrawalFee),
            totalCreditFee: formatCurrency(totalCreditFee),
        }
    }, [users, transactions, markets, betTypes, paymentSettings]);

    const isLoading = usersLoading || transactionsLoading || marketsLoading || betTypesLoading || paymentSettingsLoading;

    const statsCards = [
      { name: "Pending Deposit", value: stats.pendingDepositAmount, subValue: stats.pendingDepositUsers, icon: Hourglass },
      { name: "Pending Withdrawals", value: stats.pendingWithdrawalAmount, subValue: stats.pendingWithdrawalUsers, icon: Wallet },
      { name: "Total Users", value: stats.totalUsers, icon: Users },
      { name: "Users by Admin", value: stats.usersByAdmin, icon: UserPlus },
      { name: "Self-Registered Users", value: stats.usersBySelf, icon: UserPlus },
      { name: "Total Deposit Balance", value: stats.totalDepositBalance, icon: PiggyBank },
      { name: "Total Winning Balance", value: stats.totalWinningBalance, icon: Trophy },
      { name: "All User Wallet Balance", value: stats.allUserWalletBalance, icon: Wallet },
      { name: "Total Credit Balance", value: stats.totalCreditBalance, icon: CreditCard },
      { name: "Total Markets", value: stats.totalMarkets, icon: Store },
      { name: "Total Bet Types", value: stats.totalBetTypes, icon: Settings },
      { name: "Total Deposit", value: stats.totalDeposit, icon: ArrowUpCircle },
      { name: "Total Withdrawal", value: stats.totalWithdrawal, icon: ArrowDownCircle },
      { name: "Total Deposit Fee", value: stats.totalDepositFee, icon: TrendingUp },
      { name: "Total Credit Fee", value: stats.totalCreditFee, icon: TrendingUp },
      { name: "Total Withdrawal Fee", value: stats.totalWithdrawalFee, icon: TrendingDown },
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
 
