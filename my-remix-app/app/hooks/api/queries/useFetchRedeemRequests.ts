import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../use-auth";

export interface RedeemRequest {
  id: string;
  redeem_id: string;
  player_id: string;
  team_id: string;
  game_id: string;
  total_amount: number;
  amount_available?: number;
  amount_hold?: number;
  amount_paid?: number;
  process_status: string;
  finance_redeem_process_status?: string;
  operation_redeem_process_status?: string;
  verification_redeem_process_status?: string;
  operation_redeem_process_at?: string;
  operation_redeem_process_by?: string;
  verification_redeem_process_at?: string;
  verification_redeem_process_by?: string;
  notes?: string;
  target_id?: string;
  screenshots?: string;
  payment_methods_id?: string;
  player_platfrom_username_id?: string;
  created_at?: string;
  updated_at?: string;
  players?: {
    firstname?: string;
    lastname?: string;
  };
  payment_methods?: {
    payment_method?: string;
  };
  teams?: {
    page_name?: string;
    team_code?: string;
  };
  games?: {
    game_name?: string;
  };
  users?: {
    name?: string;
  };
}

async function fetchRedeemRequests(
  process_status: string,
  limit: number = 10,
  offset: number = 0
): Promise<RedeemRequest[]> {
  const { data, error } = await supabase
    .from("redeem_requests")
    .select(
      `
      *,
      players:player_id (
        firstname,
        lastname
      ),
      payment_methods:payment_methods_id (
        payment_method
      ),
      teams:team_id (
        page_name,
        team_code
      ),
      games:game_id (
      game_name
      ),
      users:operation_redeem_process_by (
        name
      )
    `
    )
    .eq("process_status", process_status)
    .order("created_at", { ascending: true }) // Sort by oldest first
    .range(offset, offset + limit - 1);
  console.log(data, "redeem data paginated");
  if (error) throw error;
  return data;
}

async function fetchRedeemRequestsMultiple(
  process_statuses: string[]
): Promise<RedeemRequest[]> {
  const { data, error } = await supabase
    .from("redeem_requests")
    .select(
      `
      *,
      players:player_id (
        firstname,
        lastname
      ),
      payment_methods:payment_methods_id (
        payment_method
      ),
      teams:team_id (
        page_name
      )
    `
    )
    .in("process_status", process_statuses)
    .order("created_at", { ascending: true }); // Sort by oldest first
  console.log(data, "redeem data multiple");
  if (error) throw error;
  return data as RedeemRequest[];
}

export function useFetchRedeemRequests(process_status: string, limit: number = 10, offset: number = 0) {
  return useQuery<RedeemRequest[], Error>({
    queryKey: ["redeem_requests", process_status, limit, offset],
    queryFn: () => fetchRedeemRequests(process_status, limit, offset),
  });
}

export function useFetchRedeemRequestsMultiple(process_statuses: string[]) {
  return useQuery<RedeemRequest[], Error>({
    queryKey: ["redeem_requests_multiple", process_statuses],
    queryFn: () => fetchRedeemRequestsMultiple(process_statuses),
  });
}

// Hook for fetching all redeem data (for search)
export function useFetchAllRedeemRequests(process_status: string) {
  return useQuery<RedeemRequest[], Error>({
    queryKey: ["all_redeem_requests", process_status],
    queryFn: () => fetchRedeemRequests(process_status), // No limit/offset = get all
  });
}
