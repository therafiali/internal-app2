import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../use-auth";

export interface TransferRequest {
  id: string;
  player_id: string;
  from_platform: string;
  to_platform: string;
  amount: number;
  process_status: string;
  created_at: string;
  updated_at: string;
  players?: {
    fullname?: string;
    teams?: {
      team_code?: string;
    };
  };
  from_platform_game?: {
    game_name?: string;
  };
  to_platform_game?: {
    game_name?: string;
  };
  from_platform_username?: string;
  to_platform_username?: string;
  team?: string;
}

// Base function to fetch transfer requests
async function fetchTransferRequests(): Promise<TransferRequest[]> {
  const { data, error } = await supabase
    .from("transfer_requests")
    .select(`
      *,
      players:player_id (
        fullname,
        teams:team_id (
          team_code
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch game names for from_platform and to_platform
  const transferRequestsWithGames = await Promise.all((data || []).map(async (transfer) => {
    // Fetch from platform game name
    const { data: fromGame } = await supabase
      .from("games")
      .select("game_name")
      .eq("id", transfer.from_platform)
      .single();

    // Fetch to platform game name
    const { data: toGame } = await supabase
      .from("games")
      .select("game_name")
      .eq("id", transfer.to_platform)
      .single();

    return {
      ...transfer,
      from_platform_game: { game_name: fromGame?.game_name || transfer.from_platform },
      to_platform_game: { game_name: toGame?.game_name || transfer.to_platform },
      from_platform_username: null,
      to_platform_username: null,
      team: transfer.players?.teams?.team_code || null,
    };
  }));

  return transferRequestsWithGames;
}

// Function to fetch transfer requests with status filter
async function fetchTransferRequestsByStatus(process_status: string, limit: number = 10, offset: number = 0): Promise<TransferRequest[]> {
  const { data, error } = await supabase
    .from("transfer_requests")
    .select(`
      *,
      players:player_id (
        fullname,
        teams:team_id (
          team_code
        )
      )
    `)
    .eq("process_status", process_status)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Fetch game names for from_platform and to_platform
  const transferRequestsWithGames = await Promise.all((data || []).map(async (transfer) => {
    // Fetch from platform game name
    const { data: fromGame } = await supabase
      .from("games")
      .select("game_name")
      .eq("id", transfer.from_platform)
      .single();

    // Fetch to platform game name
    const { data: toGame } = await supabase
      .from("games")
      .select("game_name")
      .eq("id", transfer.to_platform)
      .single();

    return {
      ...transfer,
      from_platform_game: { game_name: fromGame?.game_name || transfer.from_platform },
      to_platform_game: { game_name: toGame?.game_name || transfer.to_platform },
      from_platform_username: null,
      to_platform_username: null,
      team: transfer.players?.teams?.team_code || null,
    };
  }));

  return transferRequestsWithGames;
}

// Function to fetch transfer requests with multiple statuses
async function fetchTransferRequestsMultiple(process_statuses: string[]): Promise<TransferRequest[]> {
  const { data, error } = await supabase
    .from("transfer_requests")
    .select(`
      *,
      players:player_id (
        fullname,
        teams:team_id (
          team_code
        )
      )
    `)
    .in("process_status", process_statuses)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch game names for from_platform and to_platform
  const transferRequestsWithGames = await Promise.all((data || []).map(async (transfer) => {
    // Fetch from platform game name
    const { data: fromGame } = await supabase
      .from("games")
      .select("game_name")
      .eq("id", transfer.from_platform)
      .single();

    // Fetch to platform game name
    const { data: toGame } = await supabase
      .from("games")
      .select("game_name")
      .eq("id", transfer.to_platform)
      .single();

    return {
      ...transfer,
      from_platform_game: { game_name: fromGame?.game_name || transfer.from_platform },
      to_platform_game: { game_name: toGame?.game_name || transfer.to_platform },
      from_platform_username: null,
      to_platform_username: null,
      team: transfer.players?.teams?.team_code || null,
    };
  }));

  return transferRequestsWithGames;
}

// Hook for fetching all transfer requests (no filter)
export function useFetchTransferRequests() {
  return useQuery<TransferRequest[], Error>({
    queryKey: ["transfer_requests"],
    queryFn: fetchTransferRequests,
  });
}

// Hook for fetching transfer requests with status filter
export function useFetchTransferRequestsByStatus(process_status: string, limit: number = 10, offset: number = 0) {
  return useQuery<TransferRequest[], Error>({
    queryKey: ["transfer_requests", process_status, limit, offset],
    queryFn: () => fetchTransferRequestsByStatus(process_status, limit, offset),
  });
}

// Hook for fetching transfer requests with multiple statuses
export function useFetchTransferRequestsMultiple(process_statuses: string[]) {
  return useQuery<TransferRequest[], Error>({
    queryKey: ["transfer_requests_multiple", process_statuses],
    queryFn: () => fetchTransferRequestsMultiple(process_statuses),
  });
}

// Hook for fetching all transfer requests (for search)
export function useFetchAllTransferRequests() {
  return useQuery<TransferRequest[], Error>({
    queryKey: ["all_transfer_requests"],
    queryFn: fetchTransferRequests,
  });
}

// Hook for fetching all transfer requests with status filter (for search)
export function useFetchAllTransferRequestsByStatus(process_status: string) {
  return useQuery<TransferRequest[], Error>({
    queryKey: ["all_transfer_requests", process_status],
    queryFn: () => fetchTransferRequestsByStatus(process_status, 1000, 0), // Large limit to get all
  });
}
