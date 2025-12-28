
"use client";

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { format, getDay, getWeek, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isValid, toDate } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { cn } from '@/lib/utils';

// --- TYPE DEFINITIONS ---
type Result = {
  id: string;
  marketName: string; // e.g., "Kalahandi Day"
  date: any; 
  openPanna: string;
  jodi: string;
  closePanna: string;
};

type Market = {
    id: string;
    name: string;
    days: { [key: string]: boolean };
};

type DayResult = { openPanna: string; jodi: string; closePanna: string; };
type WeeklyData = { dateRange: string; results: (DayResult | null)[]; };

// --- CONSTANTS & HELPERS ---
const dayMap = [
    { name: 'MON', key: 'monday', dayIndex: 1 },
    { name: 'TUE', key: 'tuesday', dayIndex: 2 },
    { name: 'WED', key: 'wednesday', dayIndex: 3 },
    { name: 'THU', key: 'thursday', dayIndex: 4 },
    { name: 'FRI', key: 'friday', dayIndex: 5 },
    { name: 'SAT', key: 'saturday', dayIndex: 6 },
    { name: 'SUN', key: 'sunday', dayIndex: 0 },
];

const isRedJodi = (jodi: string) => jodi && jodi.length === 2 && jodi[0] === jodi[1];

const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date.toDate === 'function') return date.toDate(); // Firestore Timestamp
    if (date instanceof Date) return date; // Javascript Date
    const d = typeof date === 'string' ? parseISO(date) : toDate(date);
    return isValid(d) ? d : null;
};

// --- COMPONENT --- 
export default function PanelChartPage() {
  const params = useParams();
  const marketSlug = params.market as string; // e.g., "kalahandi-day"
  const firestore = useFirestore();

  const marketName = useMemo(() => 
    marketSlug ? marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "", 
  [marketSlug]);

  const resultsQuery = useMemoFirebase(
    () => (firestore && marketName) ? query(
      collection(firestore, "kalyan_results"), 
      where("marketName", "==", marketName),
      orderBy("date", "desc")
    ) : null,
    [firestore, marketName]
  );
  const { data: results, isLoading: isResultsLoading } = useCollection<Result>(resultsQuery);

  const allMarketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "markets"), where("active", "==", true)) : null, [firestore]);
  const { data: allMarkets, isLoading: isAllMarketsLoading } = useCollection<Market>(allMarketsQuery);
  const market = useMemo(() => {
    if (!allMarkets || !marketName) return null;
    return allMarkets.find(m => m.name === marketName);
  }, [allMarkets, marketName]);

  const displayDays = useMemo(() => {
    if (market?.days) {
        const configuredDays = dayMap.filter(day => market.days[day.key]);
        if (configuredDays.length > 0) return configuredDays;
    }
    return dayMap; // Fallback to all 7 days
  }, [market]);

  const weeklyData = useMemo<WeeklyData[]>(() => {
    if (!results || results.length === 0) return [];

    const groupedByWeek: { [week: string]: { [day: number]: DayResult } } = {};
    results.forEach(r => {
      const resultDate = parseDate(r.date);
      if (!resultDate) return;
      const dayOfWeek = getDay(resultDate); 
      const weekNumber = getWeek(resultDate, { weekStartsOn: 1 });
      const year = resultDate.getFullYear();
      const weekKey = `${year}-${weekNumber}`;
      if (!groupedByWeek[weekKey]) groupedByWeek[weekKey] = {};
      groupedByWeek[weekKey][dayOfWeek] = { openPanna: r.openPanna, jodi: r.jodi, closePanna: r.closePanna };
    });

    const validResults = results.map(r => ({...r, parsedDate: parseDate(r.date)})).filter(r => r.parsedDate);
    if (validResults.length === 0) return [];

    const firstResultDate = validResults[validResults.length - 1].parsedDate!;
    const lastResultDate = validResults[0].parsedDate!;

    let current = startOfWeek(lastResultDate, { weekStartsOn: 1 });
    const firstWeekStart = startOfWeek(firstResultDate, { weekStartsOn: 1 });
    
    const panelData: WeeklyData[] = [];
    while (current >= firstWeekStart) {
        const firstDay = current;
        const lastDay = endOfWeek(current, { weekStartsOn: 1 });
        const weekResults = displayDays.map(day => {
            const dateForDay = eachDayOfInterval({start: firstDay, end: lastDay}).find(d => getDay(d) === day.dayIndex);
            if (dateForDay) {
                const weekKey = `${dateForDay.getFullYear()}-${getWeek(dateForDay, { weekStartsOn: 1 })}`;
                return groupedByWeek[weekKey]?.[day.dayIndex] || null;
            }
            return null;
        });

        if (weekResults.some(r => r !== null)) {
             panelData.push({ dateRange: `${format(firstDay, 'dd/MM/yy')} to ${format(lastDay, 'dd/MM/yy')}`, results: weekResults });
        }
        current = new Date(current.setDate(current.getDate() - 7));
    }
    return panelData;
  }, [results, displayDays]);

  const isLoading = isAllMarketsLoading || isResultsLoading;
  const pageTitle = market?.name || marketName;
  const gridTemplateColumns = `minmax(50px, 0.5fr) repeat(${displayDays.length}, minmax(38px, 1fr))`;

  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="capitalize text-lg md:text-2xl">Panel Chart: {pageTitle}</CardTitle>
          <CardDescription className="text-white/80 text-xs md:text-sm">Weekly results for the {pageTitle} market.</CardDescription>
        </CardHeader>
        <CardContent className="p-1 md:p-4">
          {isLoading ? (
             <div className="space-y-2 p-2">
              <Skeleton className="h-8 w-full bg-white/20" />
              <Skeleton className="h-16 w-full bg-white/20" />
              <Skeleton className="h-16 w-full bg-white/20" />
            </div>
          ) : weeklyData.length > 0 ? (
            <div className="overflow-x-auto bg-black/20 rounded-md">
                <div className="font-mono text-center min-w-full">
                    <div style={{ gridTemplateColumns }} className={`grid sticky top-0 z-10 bg-purple-800/80 backdrop-blur-sm rounded-t-md`}>
                          <div className="py-1 px-0 text-[7px] md:text-[9px] font-bold flex items-center justify-center">DATE</div>
                          {displayDays.map(day => <div key={day.key} className="py-1 px-0 text-[7px] md:text-[9px] font-bold border-l border-white/20 flex items-center justify-center">{day.name}</div>)}
                    </div>
                    <div>{
                        weeklyData.map((week, weekIndex) => {
                             const [startDate, endDate] = week.dateRange.split(' to ');
                             return (
                                <div key={weekIndex} className="grid border-b border-white/20 last:border-0" style={{ gridTemplateColumns }}>
                                    <div className="text-[7px] md:text-[8px] leading-tight bg-purple-900/50 flex flex-col items-center justify-center font-bold sticky left-0">
                                        <span>{startDate}</span>
                                        <span className="text-[6px] md:text-[7px]">to</span>
                                        <span>{endDate}</span>
                                    </div>
                                    {week.results.map((day, dayIndex) => (
                                        <div key={dayIndex} className="py-0.5 px-0 flex items-center justify-center min-h-[56px] border-l border-dashed border-white/10 first:border-l-0">
                                           {day ? (
                                                day.jodi === 'L' ? (
                                                    <span className="text-[9px] font-bold text-red-400">HOLIDAY</span>
                                                ) : (
                                                    <div className={cn("w-full h-full flex items-center justify-around font-mono", isRedJodi(day.jodi) && "text-red-400")}>
                                                        <div className="flex flex-col font-bold text-[8px] md:text-[10px]">
                                                            {(day.openPanna || '').split('').map((digit, i) => <span key={`op-${i}`}>{digit}</span>)}
                                                        </div>
                                                        <div className="text-xs md:text-sm font-extrabold px-0.5">
                                                            {day.jodi}
                                                        </div>
                                                        <div className="flex flex-col font-bold text-[8px] md:text-[10px]">
                                                            {(day.closePanna || '').split('').map((digit, i) => <span key={`cp-${i}`}>{digit}</span>)}
                                                        </div>
                                                    </div>
                                                )
                                            ) : (
                                                <span className="text-white/40">**</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
          ) : (
            <Alert className="bg-black/20 border-yellow-500/50 text-white m-2">
                <Terminal className="h-4 w-4" />
                <AlertTitle>No Results Found</AlertTitle>
                <AlertDescription>
                    No results were found for the {pageTitle} market. This is the correct behavior if no results have been published yet.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
