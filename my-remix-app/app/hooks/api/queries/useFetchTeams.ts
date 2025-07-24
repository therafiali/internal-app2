import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../use-auth";

export interface Team {
  id: string;
  team_code: string;
  team_name: string | null;
  created_at: string;
}

async function fetchTeams(): Promise<string[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("team_code")
    .order("team_code", { ascending: true });

  if (error) throw error;

  // Transform to array of team codes with "All Teams" prepended and make uppercase
  const teamCodes = data?.map((team) => team.team_code.toUpperCase()) || [];
  return ["All Teams", ...teamCodes];
}

export function useFetchTeams() {
  return useQuery<string[], Error>({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });
}

// Fetch all columns for teams (for admin/config table view)
async function fetchAllTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export function useFetchAllTeams() {
  return useQuery<Team[], Error>({
    queryKey: ["all_teams"],
    queryFn: fetchAllTeams,
  });
}
