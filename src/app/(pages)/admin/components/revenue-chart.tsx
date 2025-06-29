"use client";

import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  transactionVolume: {
    label: "Transaction Volume",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

interface RevenueChartProps {
  data: any[];
  period: string;
}

export function RevenueChart({ data, period }: RevenueChartProps) {
  const [showVolume, setShowVolume] = React.useState(false);

  // Calculate trend
  const trend = React.useMemo(() => {
    if (!data || data.length < 2) return 0;
    const recent = data.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
    const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.revenue, 0);
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>
            Platform revenue for the last {period} days
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={trend > 0 ? "default" : "destructive"}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </Badge>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showVolume ? "Show Revenue" : "Show Volume"}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === "revenue" || name === "transactionVolume") {
                        return formatCurrency(value as number);
                      }
                      return value;
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey={showVolume ? "transactionVolume" : "revenue"}
                stroke={showVolume ? chartConfig.transactionVolume.color : chartConfig.revenue.color}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}