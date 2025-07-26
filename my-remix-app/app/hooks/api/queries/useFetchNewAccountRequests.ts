import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";
import { NewAccountProcessStatus } from "~/lib/constants";

export interface NewAccountRequest {
  id: string;
  player_id: string;
  game_id: string;
  process_status: string;
  created_at: string;
  players?: {
    fullname: string;
  };
  games?: {
    game_name: string;
  };
}

async function fetchNewAccountRequests(): Promise<NewAccountRequest[]> {
  const { data, error } = await supabase
    .from("player_platfrom_usernames")
    .select(`
      *,
      players:player_id (
        fullname
      ),
      games:game_id (
        game_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export const useFetchNewAccountRequests = () => {
  return useQuery({
    queryKey: ["new-account-requests"],
    queryFn: fetchNewAccountRequests,
  });
}; 