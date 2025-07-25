import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../use-auth";

export interface ResetPasswordRequest {
  id: string;
  player_id: string;
  game_platform: string;
  suggested_username: string;
  new_password: string;
  process_status: string;
  created_at: string;
  updated_at: string;
  players?: {
    fullname?: string;
    firstname?: string;
    lastname?: string;
  };
  game_platform_game?: {
    game_name?: string;
  };
  game_platform_username?: string;
}

// Base function to fetch reset password requests
async function fetchResetPasswordRequests(): Promise<ResetPasswordRequest[]> {
  const { data, error } = await supabase
    .from("reset_password_requests")
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
  const resetPasswordRequestsWithGames = await Promise.all(
    (data || []).map(async (request) => {
      // Fetch game_platform game name
      const { data: gamePlatform } = await supabase
        .from("games")
        .select("game_name")
        .eq("id", request.game_platform)
        .single();

      // Fetch game_platform username
      const { data: platformUsername } = await supabase
        .from("player_platform_usernames")
        .select("game_username")
        .eq("player_id", request.player_id)
        .eq("game_id", request.game_platform)
        .single();

      return {
        ...request,
        game_platform_game: gamePlatform,
        game_platform_username: platformUsername?.game_username,
      };
    })
  );

  return resetPasswordRequestsWithGames;
}

// Function to fetch reset password requests with status filter
async function fetchResetPasswordRequestsByStatus(process_status: string, limit: number = 10, offset: number = 0): Promise<ResetPasswordRequest[]> {
  const { data, error } = await supabase
    .from("reset_password_requests")
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
  const resetPasswordRequestsWithGames = await Promise.all(
    (data || []).map(async (request) => {
      // Fetch game_platform game name
      const { data: gamePlatform } = await supabase
        .from("games")
        .select("game_name")
        .eq("id", request.game_platform)
        .single();

      // Fetch game_platform username
      const { data: platformUsername } = await supabase
        .from("player_platform_usernames")
        .select("game_username")
        .eq("player_id", request.player_id)
        .eq("game_id", request.game_platform)
        .single();

      return {
        ...request,
        game_platform_game: gamePlatform,
        game_platform_username: platformUsername?.game_username,
      };
    })
  );

  return resetPasswordRequestsWithGames;
}

// Function to fetch reset password requests with multiple statuses
async function fetchResetPasswordRequestsMultiple(process_statuses: string[]): Promise<ResetPasswordRequest[]> {
  const { data, error } = await supabase
    .from("reset_password_requests")
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
  const resetPasswordRequestsWithGames = await Promise.all(
    (data || []).map(async (request) => {
      // Fetch game_platform game name
      const { data: gamePlatform } = await supabase
        .from("games")
        .select("game_name")
        .eq("id", request.game_platform)
        .single();

      // Fetch game_platform username
      const { data: platformUsername } = await supabase
        .from("player_platform_usernames")
        .select("game_username")
        .eq("player_id", request.player_id)
        .eq("game_id", request.game_platform)
        .single();

      return {
        ...request,
        game_platform_game: gamePlatform,
        game_platform_username: platformUsername?.game_username,
      };
    })
  );

  return resetPasswordRequestsWithGames;
}

// Hook for fetching all reset password requests (no filter)
export function useFetchResetPasswordRequests() {
  return useQuery<ResetPasswordRequest[], Error>({
    queryKey: ["reset_password_requests"],
    queryFn: fetchResetPasswordRequests,
  });
}

// Hook for fetching reset password requests with status filter
export function useFetchResetPasswordRequestsByStatus(process_status: string, limit: number = 10, offset: number = 0) {
  return useQuery<ResetPasswordRequest[], Error>({
    queryKey: ["reset_password_requests", process_status, limit, offset],
    queryFn: () => fetchResetPasswordRequestsByStatus(process_status, limit, offset),
  });
}

// Hook for fetching reset password requests with multiple statuses
export function useFetchResetPasswordRequestsMultiple(process_statuses: string[]) {
  return useQuery<ResetPasswordRequest[], Error>({
    queryKey: ["reset_password_requests_multiple", process_statuses],
    queryFn: () => fetchResetPasswordRequestsMultiple(process_statuses),
  });
}

// Hook for fetching all reset password requests (for search)
export function useFetchAllResetPasswordRequests() {
  return useQuery<ResetPasswordRequest[], Error>({
    queryKey: ["all_reset_password_requests"],
    queryFn: fetchResetPasswordRequests,
  });
}

// Hook for fetching all reset password requests with status filter (for search)
export function useFetchAllResetPasswordRequestsByStatus(process_status: string) {
  return useQuery<ResetPasswordRequest[], Error>({
    queryKey: ["all_reset_password_requests", process_status],
    queryFn: () => fetchResetPasswordRequestsByStatus(process_status, 1000, 0), // Large limit to get all
  });
} 