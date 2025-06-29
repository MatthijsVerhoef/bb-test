"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Package } from "lucide-react";

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

const COLORS = {
  active: "#ee7b46",
  completed: "hsl(142, 76%, 36%)",
  cancelled: "#EF4444",
  pending: "hsl(48, 96%, 53%)",
  disputed: "hsl(280, 65%, 60%)",
};

interface RentalStatusChartProps {
  data: {
    active: number;
    completed: number;
    cancelled: number;
    pending: number;
    disputed: number;
  };
}

export function RentalStatusChart({ data }: RentalStatusChartProps) {
  const chartData = React.useMemo(
    () =>
      [
        { name: "Active", value: data.active, color: COLORS.active },
        { name: "Completed", value: data.completed, color: COLORS.completed },
        { name: "Cancelled", value: data.cancelled, color: COLORS.cancelled },
        { name: "Pending", value: data.pending, color: COLORS.pending },
        { name: "Disputed", value: data.disputed, color: COLORS.disputed },
      ].filter((item) => item.value > 0),
    [data]
  );

  const total = React.useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  );

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.name.toLowerCase()] = {
      label: item.name,
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Rental Status Distribution
        </CardTitle>
        <CardDescription>Current status of all rentals</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 space-y-2">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
          <div className="border-t pt-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total Rentals</span>
              <span>{total}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
