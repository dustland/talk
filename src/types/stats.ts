export interface AggregatedUserRequest {
  date: string;
  requests: number;
  cost: number;
}

export interface UserMetrics {
  user_id: string;
  active_for: string;
  first_active: string;
  last_active: string;
  total_requests: number;
  average_requests_per_day_active: number;
  average_tokens_per_request: number;
  total_completion_tokens: number;
  total_prompt_tokens: number;
  cost: number;
  daily_metrics: AggregatedUserRequest[];
}
