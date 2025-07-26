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
    firstname?: string;
    lastname?: string;
  };
  from_platform_game?: {
    game_name?: string;
  };
  to_platform_game?: {
    game_name?: string;
  };
  from_platform_username?: string;
  to_platform_username?: string;
}

// Base function to fetch transfer requests
async function fetchTransferRequests(): Promise<TransferRequest[]> {
  const { data, error } = await supabase
    .from("transfer_requests")
    .select(`
      *,
      players:player_id (
        fullname,
        firstname,
        lastname
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch game names and usernames separately since there's no foreign key relationship
  const transferRequestsWithGames = await Promise.all(
    (data || []).map(async (transfer) => {
      // Fetch from_platform game name
      const { data: fromGame } = await supabase
        .from("games")
        .select("game_name")
        .eq("id", transfer.from_platform)
        .single();

      // Fetch to_platform game name
      const { data: toGame } = await supabase
        .from("games")
        .select("game_name")
        .eq("id", transfer.to_platform)
        .single();

      // Fetch from_platform username
      const { data: fromUsername } = await supabase
        .from("player_platfrom_usernames")
        .select("game_username")
        .eq("player_id", transfer.player_id)
        .eq("game_id", transfer.from_platform)
        .single();

      // Fetch to_platform username
      const { data: toUsername } = await supabase
        .from("player_platfrom_usernames")
        .select("game_username")
        .eq("player_id", transfer.player_id)
        .eq("game_id", transfer.to_platform)
        .single();

      return {
        ...transfer,
        from_platform_game: fromGame,
        to_platform_game: toGame,
        from_platform_username: fromUsername?.game_username,
        to_platform_username: toUsername?.game_username,
      };
    })
  );

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
        firstname,
        lastname
      )
    `)
    .eq("process_status", process_status)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Fetch game names and usernames separately since there's no foreign key relationship
  const transferRequestsWithGames = await Promise.all(
    (data || []).map(async (transfer) => {
      // Fetch from_platform game name
      const { data: fromGame } = await supabase
        .from("games")
        .select("game_name")
        .eq("id", transfer.from_platform)
        .single();

      // Fetch to_platform game name
      const { data: toGame } = await supabase
        .from("games")
        .select("game_name")
        .eq("id", transfer.to_platform)
        .single();

      // Fetch from_platform username
      const { data: fromUsername } = await supabase
        .from("player_platfrom_usernames")
        .select("game_username")
        .eq("player_id", transfer.player_id)
        .eq("game_id", transfer.from_platform)
        .single();

      // Fetch to_platform username
      const { data: toUsername } = await supabase
        .from("player_platfrom_usernames")
        .select("game_username")
        .eq("player_id", transfer.player_id)
        .eq("game_id", transfer.to_platform)
        .single();

      return {
        ...transfer,
        from_platform_game: fromGame,
        to_platform_game: toGame,
        from_platform_username: fromUsername?.game_username,
        to_platform_username: toUsername?.game_username,
      };
    })
  );

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
        firstname,
        lastname
      )
    `)
    .in("process_status", process_statuses)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch game names and usernames separately since there's no foreign key relationship
  const transferRequestsWithGames = await Promise.all(
    (data || []).map(async (transfer) => {
      // Fetch from_platform game name
      const { data: fromGame } = await supabase
        .from("games")
        .select("game_name")
        .eq("id", transfer.from_platform)
        .single();

      // Fetch to_platform game name
      const { data: toGame } = await supabase
        .from("games")
        .select("game_name")
        .eq("id", transfer.to_platform)
        .single();

      // Fetch from_platform username
      const { data: fromUsername } = await supabase
        .from("player_platfrom_usernames")
        .select("game_username")
        .eq("player_id", transfer.player_id)
        .eq("game_id", transfer.from_platform)
        .single();

      // Fetch to_platform username
      const { data: toUsername } = await supabase
        .from("player_platfrom_usernames")
        .select("game_username")
        .eq("player_id", transfer.player_id)
        .eq("game_id", transfer.to_platform)
        .single();

      return {
        ...transfer,
        from_platform_game: fromGame,
        to_platform_game: toGame,
        from_platform_username: fromUsername?.game_username,
        to_platform_username: toUsername?.game_username,
      };
    })
  );

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
