"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const panelChartData = [
  { type: "Single Panna", count: 120 },
  { type: "Double Panna", count: 78 },
  { type: "Triple Panna", count: 22 },
]

const digitTrendData = [
    { date: "2024-07-15", digit: 4 },
    { date: "2024-07-16", digit: 8 },
    { date: "2024-07-17", digit: 1 },
    { date: "2024-07-18", digit: 5 },
    { date: "2024-07-19", digit: 2 },
    { date: "2024-07-20", digit: 7 },
    { date: "2024-07-21", digit-trend: 3 },
];

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--primary))",
  },
  digit: {
    label: "Digit",
    color: "hsl(var(--accent))",
  }
}

export default function ChartsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Panel Charts</h1>
        <p className="text-muted-foreground">
          Visualize panel data and trends.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Panna Type Frequency</CardTitle>
            <CardDescription>
              Distribution of Single, Double, and Triple Pannas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <BarChart accessibilityLayer data={panelChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="type"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                 <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Digit Trend</CardTitle>
            <CardDescription>
              Trend of opening digits over the last week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <LineChart
                accessibilityLayer
                data={digitTrendData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                   tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                />
                <YAxis domain={[0, 9]} tickCount={10} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Line
                  dataKey="digit"
                  type="monotone"
                  stroke="var(--color-digit)"
                  strokeWidth={2}
                  dot={{
                    fill: "var(--color-digit)",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
