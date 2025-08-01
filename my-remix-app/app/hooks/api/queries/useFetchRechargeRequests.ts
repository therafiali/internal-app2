import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../use-auth";
import { RechargeProcessStatus } from "~/lib/constants";

export interface RechargeRequest {
  id: string;
  recharge_id?: string;
  payment_method: string;
  amount?: number;
  created_at?: string;
  process_status?: string;
  screenshot_url?: string[] | null;
  support_recharge_process_status?: string;
  support_recharge_process_by?: string;
  finance_recharge_process_status?: string;
  finance_recharge_process_by?: string;
  finance_recharge_process_at?: string;
  ct_type?: string;
  target_id?: string;
  player_id?: string;
  player_platfrom_username_id?: string;
  players?: {
    fullname?: string;
    firstname?: string;
    lastname?: string;
  };
  payment_methods?: {
    payment_method?: string;
    id?: string;
  };
  teams?: {
    team_name?: string;
    team_code?: string;
  };
  games?: {
    game_name?: string;
  };
  player_platfrom_usernames?: {
    game_username?: string;
  };
  users?: {
    name?: string;
    employee_code?: string;
  }[];
  support_users?: {
    name?: string;
    employee_code?: string;
  }[];
  finance_users?: {
    name?: string;
    employee_code?: string;
  }[];
  // Add other fields as needed
}

async function fetchRechargeRequests(
  process_status: RechargeProcessStatus,
  limit?: number,
  offset?: number
): Promise<{ data: RechargeRequest[] }> {
  // First get total count
  const { count, error: countError } = await supabase
    .from("recharge_requests")
    .select("*", { count: "exact", head: true })
    .eq("process_status", process_status);
  if (countError) throw countError;

  // Then get paginated data
  let query = supabase
    .from("recharge_requests")
    .select(
      `
      *,
      players:player_id (
        fullname,
        firstname,
        lastname
      ),
      payment_methods:payment_method_id (
        payment_method,
        id
      ),
      teams:team_id (
        team_name,
        team_code
      ),
      games:game_id(
        game_name
      ),
      player_platfrom_usernames:player_platfrom_username_id (
        game_username
      )
    `
    )
    .order("created_at", { ascending: false })
    .eq("process_status", process_status);

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  if (offset !== undefined) {
    query = query.range(offset, offset + (limit || 10) - 1);
  }

  const { data, error } = await query;
  console.log(data, "data");
  //
  if (error) throw error;
  return { data: data as RechargeRequest[] };
}

async function fetchRechargeRequestsCount(
  process_status: RechargeProcessStatus
): Promise<number> {
  const { count, error } = await supabase
    .from("recharge_requests")
    .select("*", { count: "exact", head: true })
    .order("created_at", { ascending: false })
    .eq("process_status", process_status);

  if (error) throw error;
  return count || 0;
}

async function fetchRechargeRequestsMultiple(
  process_status: RechargeProcessStatus[]
): Promise<RechargeRequest[]> {
  const { data, error } = await supabase
    .from("recharge_requests")
    .select(
      `
      *,
      players:player_id (
        fullname,
        teams:  team_id (
          team_code
        )
      ),
      payment_methods:payment_method_id (
        payment_method,
        id
      ),
      games:game_id (
        game_name
      ),
      teams:team_id (
        team_name,
        team_code
      ),
      player_platfrom_usernames:player_platfrom_username_id (
        game_username
      )

    `
    )
    .order("created_at", { ascending: false })
    .in("process_status", process_status);
  console.log(data, "data");
  //
  if (error) throw error;
  return data as RechargeRequest[];
}

export function useFetchRechargeRequests(
  process_status: RechargeProcessStatus,
  limit?: number,
  offset?: number
) {
  return useQuery<{ data: RechargeRequest[]; total: number }, Error>({
    queryKey: ["recharge_requests", process_status, limit, offset],
    queryFn: () => fetchRechargeRequests(process_status, limit, offset),
  });
}

export function useFetchRechargeRequestsCount(
  process_status: RechargeProcessStatus
) {
  return useQuery<number, Error>({
    queryKey: ["recharge_requests_count", process_status],
    queryFn: () => fetchRechargeRequestsCount(process_status),
  });
}

export function useFetchRechargeRequestsMultiple(
  process_status: RechargeProcessStatus[]
) {
  return useQuery<RechargeRequest[], Error>({
    queryKey: ["recharge_requests_multiple", process_status],
    queryFn: () => fetchRechargeRequestsMultiple(process_status),
  });
}

// Hook for fetching all data (for client-side search like userlist)
export function useFetchAllRechargeRequests(
  process_status: RechargeProcessStatus
) {
  return useQuery<{ data: RechargeRequest[]; total: number }, Error>({
    queryKey: ["all_recharge_requests", process_status],
    queryFn: () => fetchRechargeRequests(process_status), // No limit/offset = get all
  });
}

// Function to fetch recharge requests for a specific player
async function fetchPlayerRechargeRequests(
  playerId: string
): Promise<RechargeRequest[]> {
  const { data, error } = await supabase
    .from("recharge_requests")
    .select(
      `
      *,
      players:player_id (
        fullname
      ),
      payment_methods:payment_method_id (
        payment_method,
        id
      ),
      teams:team_id (
        team_name,
        team_code
      ),
      games:game_id(
        game_name
      ),
      player_platform_usernames:player_platfrom_username_id (
        game_username
      )
    `
    )
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  console.log(data, "recharge all data");
  if (error) throw error;
  return data as RechargeRequest[];
}

// Hook for fetching recharge requests for a specific player
export function useFetchPlayerRechargeRequests(playerId: string) {
  return useQuery<RechargeRequest[], Error>({
    queryKey: ["player_recharge_requests", playerId],
    queryFn: () => fetchPlayerRechargeRequests(playerId),
    enabled: !!playerId, // Only run if playerId is provided
  });
}
