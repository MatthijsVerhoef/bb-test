"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { Users, UserPlus } from "lucide-react";

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

const chartConfig = {
  newUsers: {
    label: "New Users",
    color: "hsl(var(--primary))",
  },
  newLessors: {
    label: "New Lessors",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

interface UserGrowthChartProps {
  data: any[];
  period: string;
}

export function UserGrowthChart({ data, period }: UserGrowthChartProps) {
  const totalNewUsers = React.useMemo(
    () => data.reduce((sum, d) => sum + d.newUsers, 0),
    [data]
  );

  const totalNewLessors = React.useMemo(
    () => data.reduce((sum, d) => sum + d.newLessors, 0),
    [data]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Growth
        </CardTitle>
        <CardDescription>
          New registrations over the last {period} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalNewUsers}</p>
            <p className="text-sm text-muted-foreground">Total New Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{totalNewLessors}</p>
            <p className="text-sm text-muted-foreground">New Lessors</p>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="newUsers" fill={chartConfig.newUsers.color} radius={[4, 4, 0, 0]} />
              <Bar dataKey="newLessors" fill={chartConfig.newLessors.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}