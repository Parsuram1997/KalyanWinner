
"use client";

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { format, getDay, getWeek, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { cn } from '@/lib/utils';

type Result = {
  id: string;
  marketName: string;
  date: string; // ISO string
  openPanna: string;
  jodi: string;
  closePanna: string;
};

type Market = {
    id: string;
    name: string;
    days: {
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
        sunday: boolean;
    };
};

type DayResult = {
  openPanna: string;
  jodi: string;
  closePanna: string;
};

type WeeklyData = {
  dateRange: string;
  results: (DayResult | null)[];
};

const dayMap = [
    { name: 'MON', key: 'monday', dayIndex: 1 },
    { name: 'TUE', key: 'tuesday', dayIndex: 2 },
    { name: 'WED', key: 'wednesday', dayIndex: 3 },
    { name: 'THU', key: 'thursday', dayIndex: 4 },
    { name: 'FRI', key: 'friday', dayIndex: 5 },
    { name: 'SAT', key: 'saturday', dayIndex: 6 },
    { name: 'SUN', key: 'sunday', dayIndex: 0 },
];


const isRedJodi = (jodi: string) => {
    if (!jodi || jodi.length !== 2) return false;
    return jodi[0] === jodi[1];
};

export default function PanelChartPage() {
  const params = useParams();
  const marketName = params.market as string;
  const firestore = useFirestore();

  const marketQuery = useMemoFirebase(
    () => (firestore && marketName) ? query(collection(firestore, 'markets'), where('name', '==', marketName)) : null,
    [firestore, marketName]
  );
  const { data: marketData, isLoading: isMarketLoading } = useCollection<Market>(marketQuery);
  const market = marketData?.[0];

  const resultsQuery = useMemoFirebase(
    () => (firestore && marketName) ? query(
      collection(firestore, "kalyan_results"),
      where("marketName", "==", marketName),
      orderBy("date", "desc")
    ) : null,
    [firestore, marketName]
  );

  const { data: results, isLoading: isResultsLoading } = useCollection<Result>(resultsQuery);
  
  const displayDays = useMemo(() => {
    if (!market?.days) {
        // Default to all days if market data is not available
        return dayMap;
    }
    return dayMap.filter(day => market.days[day.key as keyof Market['days']]);
  }, [market]);

  const weeklyData = useMemo<WeeklyData[]>(() => {
    if (!results || results.length === 0) return [];

    const groupedByWeek: { [week: string]: { [day: number]: DayResult } } = {};
    results.forEach(r => {
      const resultDate = parseISO(r.date);
      const dayOfWeek = getDay(resultDate); // Sunday = 0, Monday = 1, ...
      const weekNumber = getWeek(resultDate, { weekStartsOn: 1 }); // Week starts on Monday
      const year = resultDate.getFullYear();
      const weekKey = `${year}-${weekNumber}`;

      if (!groupedByWeek[weekKey]) {
        groupedByWeek[weekKey] = {};
      }
      groupedByWeek[weekKey][dayOfWeek] = { openPanna: r.openPanna, jodi: r.jodi, closePanna: r.closePanna };
    });

    const panelData: WeeklyData[] = [];
    const firstResultDate = parseISO(results[results.length - 1].date);
    const lastResultDate = parseISO(results[0].date);
    let current = startOfWeek(lastResultDate, { weekStartsOn: 1 });
    const firstWeekStart = startOfWeek(firstResultDate, { weekStartsOn: 1 });
    
    while (current >= firstWeekStart) {
        const firstDayCurrentWeek = current;
        const lastDayCurrentWeek = endOfWeek(current, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({start: firstDayCurrentWeek, end: lastDayCurrentWeek});
        
        const weekResults: (DayResult | null)[] = [];
        
        for(const day of displayDays) {
            const dateForDay = weekDays.find(d => getDay(d) === day.dayIndex);
            if (dateForDay && groupedByWeek[ `${dateForDay.getFullYear()}-${getWeek(dateForDay, { weekStartsOn: 1 })}` ]?.[day.dayIndex]) {
                weekResults.push(groupedByWeek[ `${dateForDay.getFullYear()}-${getWeek(dateForDay, { weekStartsOn: 1 })}` ][day.dayIndex]);
            } else {
                weekResults.push(null);
            }
        }

        if (weekResults.some(r => r !== null)) {
             panelData.push({
                dateRange: `${format(firstDayCurrentWeek, 'dd/MM/yy')} to ${format(lastDayCurrentWeek, 'dd/MM/yy')}`,
                results: weekResults,
            });
        }
        
        current = new Date(current.setDate(current.getDate() - 7));
    }

    return panelData;

  }, [results, displayDays]);

  const isLoading = isMarketLoading || isResultsLoading;

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle className="capitalize">Panel Chart: {marketName}</CardTitle>
          <CardDescription className="text-white/80">Weekly results for the {marketName} market.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full bg-white/20" />
              <Skeleton className="h-20 w-full bg-white/20" />
              <Skeleton className="h-20 w-full bg-white/20" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="overflow-x-auto p-1 bg-black/20 rounded-lg">
                <div className="space-y-2 font-mono">
                    <div style={{ gridTemplateColumns: `minmax(80px, auto) repeat(${displayDays.length}, minmax(40px, 1fr))`}} className={`hidden md:grid sticky top-0 z-10 bg-purple-800/80 backdrop-blur-sm p-1 rounded-t-md`}>
                          <div className="p-1 text-center text-xs font-bold">DATE</div>
                          {displayDays.map(day => (
                            <div key={day.key} className="border-l border-white/20 p-1 text-center text-xs font-bold">{day.name}</div>
                          ))}
                    </div>
                    {weeklyData.map((week, weekIndex) => (
                         <div key={weekIndex} className="md:grid border-b border-white/20 last:border-0" style={{ gridTemplateColumns: `minmax(80px, auto) repeat(${displayDays.length}, minmax(40px, 1fr))`}}>
                            <div className="p-1.5 text-center text-[10px] bg-purple-900/50 flex items-center justify-center font-bold sticky left-0">{week.dateRange.replace(/ to /g, '\n')}</div>
                           
                            {week.results.map((day, dayIndex) => (
                                <div key={dayIndex} className="border-l border-white/20 p-1 text-center text-sm flex flex-col items-center justify-center min-h-[50px] md:border-t-0 border-t border-dashed border-white/10">
                                    {day ? (
                                        <div className={cn("flex flex-col items-center justify-center font-bold", isRedJodi(day.jodi) && 'text-red-400')}>
                                            <span>{day.openPanna}</span>
                                            <span>{day.jodi}</span>
                                            <span>{day.closePanna}</span>
                                        </div>
                                    ) : <span className="text-white/40">--</span>}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
          ) : (
            <Alert className="bg-black/20 border-yellow-500/50 text-white">
                <Terminal className="h-4 w-4" />
                <AlertTitle>No Results Found</AlertTitle>
                <AlertDescription>
                    There are no results available for the {marketName} market yet. Please check back later.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
