
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { getWeek, startOfWeek, endOfWeek, format, eachDayOfInterval, getDay, subDays } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Result = {
  id: string;
  date: string; // YYYY-MM-DD
  openPanna: string;
  jodi: string;
  closePanna: string;
  marketName: string;
};

type DayResult = {
  openPanna: string;
  jodi: string;
  closePanna: string;
};

type WeekData = {
  dateRange: string;
  results: (DayResult | null)[];
};

const isDataAvailable = (day: DayResult | null) => {
    return day && day.openPanna && day.closePanna && day.jodi && day.jodi !== '--';
}

const PanelChart = ({ title, marketName }: { title: string, marketName: string }) => {
  const firestore = useFirestore();

  const resultsQuery = useMemoFirebase(() => {
    if (!firestore || !marketName) return null;
    const startDate = subDays(new Date(), 365);
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');

    return query(
      collection(firestore, "kalyan_results"),
      where("marketName", "==", marketName),
      where("date", ">=", formattedStartDate),
      orderBy("date", "desc")
    );
  }, [firestore, marketName]);

  const { data: results, isLoading } = useCollection<Result>(resultsQuery, { skip: !firestore });

  const weeklyData = useMemo(() => {
    if (!results || results.length === 0) return [];

    const groupedByWeek: { [weekAndYear: string]: { [dayOfWeek: number]: DayResult } } = {};
    
    results.forEach(result => {
        const resultDate = new Date(result.date);
        const weekNumber = getWeek(resultDate, { weekStartsOn: 1 });
        const year = resultDate.getFullYear();
        const weekKey = `${year}-${weekNumber}`;
        const dayOfWeek = (getDay(resultDate) + 6) % 7; // Monday = 0, Sunday = 6
        
        if (!groupedByWeek[weekKey]) {
            groupedByWeek[weekKey] = {};
        }

        groupedByWeek[weekKey][dayOfWeek] = {
            openPanna: result.openPanna,
            jodi: result.jodi,
            closePanna: result.closePanna,
        };
    });

    const sortedWeekKeys = Object.keys(groupedByWeek).sort((a, b) => {
        const [yearA, weekA] = a.split('-').map(Number);
        const [yearB, weekB] = b.split('-').map(Number);
        if (yearA !== yearB) {
            return yearB - yearA;
        }
        return weekB - weekA;
    });

    const panelData: WeekData[] = [];
    
    for (const weekKey of sortedWeekKeys) {
        const [year, weekNum] = weekKey.split('-').map(Number);
        const firstDayOfYear = new Date(year, 0, 1);
        const firstDayOfWeekInYear = startOfWeek(firstDayOfYear, { weekStartsOn: 1 });
        
        let firstDayCurrentWeek = new Date(firstDayOfWeekInYear);
        firstDayCurrentWeek.setDate(firstDayCurrentWeek.getDate() + (weekNum - 1) * 7);

        if (getWeek(firstDayOfYear, {weekStartsOn: 1}) > 1 && weekNum === 1) {
             firstDayCurrentWeek.setDate(firstDayCurrentWeek.getDate() - 7);
        }

        const weekResults: (DayResult | null)[] = [];
        const weekDays = eachDayOfInterval({start: firstDayCurrentWeek, end: endOfWeek(firstDayCurrentWeek, {weekStartsOn: 1})});
        
        for(const day of weekDays) {
           const dayOfWeek = (getDay(day) + 6) % 7; // Monday = 0, Sunday = 6
           const currentWeekNum = getWeek(day, { weekStartsOn: 1 });
           const currentYear = day.getFullYear();
           const currentWeekKey = `${currentYear}-${currentWeekNum}`;
           
           if (groupedByWeek[currentWeekKey] && groupedByWeek[currentWeekKey][dayOfWeek]) {
               weekResults.push(groupedByWeek[currentWeekKey][dayOfWeek]);
           } else {
               weekResults.push(null);
           }
        }
        
        panelData.push({
            dateRange: `${format(firstDayCurrentWeek, 'dd/MM/yy')} to ${format(endOfWeek(firstDayCurrentWeek, {weekStartsOn: 1}), 'dd/MM/yy')}`,
            results: weekResults,
          });
    }

    return panelData;
  }, [results]);

  const isRedJodi = (jodi: string) => {
    if (!jodi || jodi.length !== 2) return false;
    return jodi[0] === jodi[1];
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-white/80">A rolling yearly record of game results.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? <Skeleton className="w-full h-96 bg-white/20" /> : weeklyData.length === 0 ? <p className="text-center text-white/80 p-8">No results found for this market in the last 365 days.</p> : (
              <div className="w-full overflow-x-auto rounded-lg border border-white/20">
                  <div className="divide-y divide-white/20 min-w-full">
                  <div className="grid grid-cols-[minmax(50px,auto)_repeat(7,minmax(40px,1fr))] bg-black/20 font-semibold">
                      <div className="p-1 text-center flex items-center justify-center text-xs shrink-0">Date</div>
                      <div className="border-l border-white/20 p-1 text-center text-xs">MON</div>
                      <div className="border-l border-white/20 p-1 text-center text-xs">TUE</div>
                      <div className="border-l border-white/20 p-1 text-center text-xs">WED</div>
                      <div className="border-l border-white/20 p-1 text-center text-xs">THU</div>
                      <div className="border-l border-white/20 p-1 text-center text-xs">FRI</div>
                      <div className="border-l border-white/20 p-1 text-center text-xs">SAT</div>
                      <div className="border-l border-white/20 p-1 text-center text-xs">SUN</div>
                  </div>
                  {weeklyData.map((week, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-[minmax(50px,auto)_repeat(7,minmax(40px,1fr))]">
                      <div className="py-1 text-center flex flex-col items-center justify-center text-xs shrink-0">
                          <span className="text-[10px]">{week.dateRange.split(" to ")[0]}</span>
                          <span className="text-white/70 text-[10px]">to</span>
                          <span className="text-[10px]">{week.dateRange.split(" to ")[1]}</span>
                      </div>
                      {week.results.map((day, dayIndex) => (
                          <div key={dayIndex} className="border-l border-white/20 py-1 text-center flex items-center justify-center min-h-[60px]">
                          {day && isDataAvailable(day) ? (
                              day.jodi === 'L' ? (
                                <div className="flex items-center justify-center h-full text-red-400 font-bold text-xs">H</div>
                              ) : (
                                <div className="flex justify-around items-center w-full text-xs font-mono text-white/80">
                                  <div className="flex flex-col items-center">
                                    {day.openPanna.split('').map((digit, i) => <div key={i}>{digit}</div>)}
                                  </div>
                                  <div className={cn("font-bold text-sm mx-0.5", isRedJodi(day.jodi) ? "text-red-400" : "text-white")}>{day.jodi}</div>
                                  <div className="flex flex-col items-center">
                                    {day.closePanna.split('').map((digit, i) => <div key={i}>{digit}</div>)}
                                  </div>
                                </div>
                              )
                          ) : (
                              <div className="flex items-center justify-center h-full text-white/70 text-lg">
                              *
                              </div>
                          )}
                          </div>
                      ))}
                      </div>
                  ))}
                  </div>
              </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default function PanelChartPage() {
  const params = useParams();
  const marketSlug = params.market as string;
  const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="flex flex-col gap-6">
      <PanelChart title={`${marketName} Chart`} marketName={marketName} />
    </div>
  );
}
