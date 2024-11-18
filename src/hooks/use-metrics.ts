import useSWR from "swr";
import { UserMetrics } from "@/types/stats";
interface UseMetricsProps {
  range?: "24h" | "7d" | "30d" | "month" | "all";
}

const fetcher = async (url: string): Promise<UserMetrics> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch statistics");
  }
  return res.json();
};

export function useMetrics({ range = "month" }: UseMetricsProps = {}) {
  const {
    data: metrics,
    error: metricsError,
    isLoading,
  } = useSWR(`/api/user/metrics?range=${range}&aggregate=true`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every minute
  });

  return {
    metrics,
    isLoading,
    error: metricsError,
  };
}
