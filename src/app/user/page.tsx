"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Coins, Zap, Clock } from "lucide-react";
import { useMetrics } from "@/hooks/use-metrics";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

// Custom tooltip styles
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/40 rounded-lg p-2 text-xs text-white">
        <p className="font-medium">{label}</p>
        {payload.map((pld) => (
          <p key={pld.name} className="text-[10px]">
            {pld.name}: {pld.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function UserPage() {
  const [timeRange, setTimeRange] = useState<
    "24h" | "7d" | "30d" | "month" | "all"
  >("month");

  const { metrics, isLoading, error } = useMetrics({
    range: timeRange,
  });

  // Add time range selector options
  const timeRangeOptions = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "month", label: "This Month" },
    { value: "all", label: "All Time" },
  ];

  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;
  if (!metrics) return <Error message="No data available" />;

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Date Range */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/70">
          Statistics from {metrics.first_active} to {metrics.last_active}
        </div>
        {/* Time Range Selector */}
        <Select
          value={timeRange}
          onValueChange={(value: any) => setTimeRange(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent className="bg-white/30 backdrop-blur-lg">
            {timeRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-lg border-white/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Practice Sessions
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_requests}</div>
            <p className="text-xs text-white/70">
              Avg {metrics.average_requests_per_day_active}/day
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tokens Used
            </CardTitle>
            <Zap className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.total_completion_tokens + metrics.total_prompt_tokens}
            </div>
            <p className="text-xs text-white/70">
              Prompt: {metrics.total_prompt_tokens} | Completion:{" "}
              {metrics.total_completion_tokens}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost</CardTitle>
            <Coins className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.cost.toFixed(4)}</div>
            <p className="text-xs text-white/70">USD</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Average Tokens/Session
            </CardTitle>
            <Clock className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.average_tokens_per_request)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="bg-white/10 backdrop-blur-lg border-white/40">
          <CardHeader>
            <CardTitle className="text-white">Daily Requests</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.daily_metrics}
                barSize={20}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <XAxis
                  dataKey="date"
                  stroke="#fff"
                  tick={{ fill: "#fff" }}
                  tickLine={{ stroke: "#fff" }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#fff"
                  tick={{ fill: "#fff" }}
                  tickLine={{ stroke: "#fff" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="requests" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/40">
          <CardHeader>
            <CardTitle className="text-white">Daily Cost (USD)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.daily_metrics}
                barSize={20}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <XAxis
                  dataKey="date"
                  stroke="#fff"
                  tick={{ fill: "#fff" }}
                  tickLine={{ stroke: "#fff" }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#fff"
                  tick={{ fill: "#fff" }}
                  tickLine={{ stroke: "#fff" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
