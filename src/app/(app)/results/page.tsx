
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Result = { 
  id: string;
  date: string;
  market: string;
  openPanna: string;
  jodi: string;
  closePanna: string;
};

// Helper to format date string
const getFormattedDate = (dateString: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const resultDate = new Date(dateString);
  resultDate.setHours(0, 0, 0, 0);

  if (resultDate.getTime() === today.getTime()) {
    return 'Today';
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (resultDate.getTime() === yesterday.getTime()) {
      return 'Yesterday'
  }
  
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const ResultsList = ({ resultsToShow, isLoading }: { resultsToShow: Result[], isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    )
  }

  if (resultsToShow.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No results found for this market.</p>
  }

  return (
  <>
    {/* Desktop Table */}
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Market</TableHead>
            <TableHead>Open Panna</TableHead>
            <TableHead>Jodi</TableHead>
            <TableHead>Close Panna</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resultsToShow.map((result) => (
            <TableRow key={result.id}>
              <TableCell className="font-medium">{getFormattedDate(result.date)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    result.market.includes("Night") ? "default" : "secondary"
                  }
                >
                  {result.market}
                </Badge>
              </TableCell>
              <TableCell>{result.openPanna}</TableCell>
              <TableCell>
                <div className="font-bold text-lg text-primary">
                  {result.jodi}
                </div>
              </TableCell>
              <TableCell>{result.closePanna}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* Mobile List */}
    <div className="grid gap-4 md:hidden">
      {resultsToShow.map((result) => (
        <div
          key={result.id}
          className="rounded-lg border bg-card text-card-foreground p-4"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-semibold text-base">{result.market}</p>
              <p className="text-sm text-muted-foreground">{getFormattedDate(result.date)}</p>
            </div>
            <Badge
              variant={
                result.market.includes("Night") ? "default" : "secondary"
              }
            >
              {result.market.split(" ")[1]}
            </Badge>
          </div>
          <div className="flex items-center justify-around text-center">
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">Open</span>
              <span className="text-lg font-bold tracking-widest">
                {result.openPanna}
              </span>
            </div>
            <div className="flex flex-col items-center rounded-md bg-primary px-3 py-1 text-primary-foreground">
              <span className="text-2xl font-bold tracking-wider">
                {result.jodi}
              </span>
              <span className="text-[10px] font-medium">Jodi</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">Close</span>
              <span className="text-lg font-bold tracking-widest">
                {result.closePanna}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
);
}

export default function ResultsPage() {
  const firestore = useFirestore();

  const kalyanDayQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "kalyan_results"), where("marketName", "==", "Kalyan Day"), orderBy("date", "desc")) : null, [firestore]);
  const { data: kalyanDayResults, isLoading: isDayLoading } = useCollection<any>(kalyanDayQuery);

  const kalyanNightQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "kalyan_results"), where("marketName", "==", "Kalyan Night"), orderBy("date", "desc")) : null, [firestore]);
  const { data: kalyanNightResults, isLoading: isNightLoading } = useCollection<any>(kalyanNightQuery);

  const dayResults = kalyanDayResults?.map(r => ({ ...r, market: r.marketName })) || [];
  const nightResults = kalyanNightResults?.map(r => ({ ...r, market: r.marketName })) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Results History</h1>
        <p className="text-muted-foreground">
          Browse the history of Kalyan Matka results.
        </p>
      </div>

      <Tabs defaultValue="kalyan-day" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kalyan-day">Kalyan Day</TabsTrigger>
          <TabsTrigger value="kalyan-night">Kalyan Night</TabsTrigger>
        </TabsList>
        <TabsContent value="kalyan-day">
          <Card>
            <CardHeader>
              <CardTitle>Kalyan Day Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsList resultsToShow={dayResults} isLoading={isDayLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="kalyan-night">
          <Card>
            <CardHeader>
              <CardTitle>Kalyan Night Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsList resultsToShow={nightResults} isLoading={isNightLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

