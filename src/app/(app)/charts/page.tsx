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
    { date: "2024-07-21", digit: 3 },
];

const jodiFrequencyData = [
  { jodi: "13", count: 25 },
  { jodi: "45", count: 22 },
  { jodi: "88", count: 20 },
  { jodi: "07", count: 18 },
  { jodi: "62", count: 17 },
  { jodi: "91", count: 15 },
  { jodi: "53", count: 14 },
  { jodi: "29", count: 12 },
];

const singleDigitFrequencyData = [
  { digit: "1", count: 88 },
  { digit: "2", count: 82 },
  { digit: "3", count: 90 },
  { digit: "4", count: 75 },
  { digit: "5", count: 85 },
  { digit: "6", count: 78 },
  { digit: "7", count: 92 },
  { digit: "8", count: 80 },
  { digit: "9", count: 81 },
  { digit: "0", count: 79 },
];

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--primary))",
  },
  digit: {
    label: "Digit",
    color: "hsl(var(--accent))",
  },
  jodi: {
    label: "Jodi",
    color: "hsl(var(--chart-2))",
  }
}

export default function ChartsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Trend Charts</h1>
        <p className="text-muted-foreground">
          Visualize game data, frequencies, and digit trends.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Panna Type Frequency</CardTitle>
            <CardDescription>
              Distribution of Single, Double, and Triple Pannas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full sm:h-[250px]">
              <BarChart accessibilityLayer data={panelChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="type"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                 <YAxis tickCount={5} tick={{ fontSize: 12 }} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} barSize={40} />
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
            <ChartContainer config={chartConfig} className="h-[200px] w-full sm:h-[250px]">
              <LineChart
                accessibilityLayer
                data={digitTrendData}
                margin={{
                  left: 0,
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
                   tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 9]} tickCount={5} tick={{ fontSize: 12 }} />
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

        <Card>
          <CardHeader>
            <CardTitle>Jodi Frequency</CardTitle>
            <CardDescription>
              Most frequent Jodi numbers in the last month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full sm:h-[250px]">
              <BarChart accessibilityLayer data={jodiFrequencyData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="jodi"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  className="font-bold"
                />
                 <XAxis type="number" tickCount={5} tick={{ fontSize: 12 }} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" fill="var(--color-jodi)" radius={4} barSize={20} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Single Digit (Ank) Frequency</CardTitle>
            <CardDescription>
              How many times each digit (0-9) appeared recently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full sm:h-[250px]">
              <BarChart accessibilityLayer data={singleDigitFrequencyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="digit"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 12, fontWeight: 700 }}
                />
                 <YAxis tickCount={5} tick={{ fontSize: 12 }} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
