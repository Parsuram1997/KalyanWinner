
"use client";

import { getPanelChartData } from "@/lib/panel-chart-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "next/navigation";


const PanelChart = ({ title }: { title: string }) => {
  const weeklyData = getPanelChartData();
  
  const isRedJodi = (jodi: string) => {
    if (!jodi || jodi.length !== 2) return false;
    return jodi[0] === jodi[1];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>A yearly record of game results.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <div className="w-full overflow-x-auto">
            <div className="divide-y divide-border">
              {weeklyData.map((week, weekIndex) => (
                <div key={weekIndex} className={`grid grid-cols-[auto_repeat(6,1fr)] ${weekIndex === 0 ? 'bg-muted font-semibold' : ''}`}>
                  <div className="p-1 text-center flex flex-col items-center justify-center text-xs shrink-0 w-[80px]">
                    {weekIndex === 0 ? (
                      <span className="text-[10px] font-bold">Date</span>
                    ) : (
                      <>
                        <span className="text-[10px]">{week.dateRange.split(" to ")[0]}</span>
                        <span className="text-muted-foreground text-[10px]">to</span>
                        <span className="text-[10px]">{week.dateRange.split(" to ")[1]}</span>
                      </>
                    )}
                  </div>
                  {week.results.map((day, dayIndex) => (
                    <div key={dayIndex} className="border-l p-1 text-center">
                      {weekIndex === 0 ? (
                        <div className="text-[10px] font-bold">{["MON", "TUE", "WED", "THU", "FRI", "SAT"][dayIndex]}</div>
                      ) : day ? (
                        <div>
                          <div className="text-[10px] text-muted-foreground">{day.openPanna}</div>
                          <div className={`font-bold text-xs my-0.5 ${isRedJodi(day.jodi) ? "text-destructive" : "text-primary"}`}>{day.jodi}</div>
                          <div className="text-[10px] text-muted-foreground">{day.closePanna}</div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-lg">
                          *
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PanelChartPage() {
  const params = useParams();
  const marketSlug = params.market as string;
  const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="flex flex-col gap-6">
       <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{marketName} Panel Chart 2023</h1>
        <p className="text-muted-foreground">
          Yearly results for the {marketName} Matka game.
        </p>
      </div>
      <PanelChart title={`${marketName} Chart`} />
    </div>
  );
}
