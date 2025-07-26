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
  const teamCodes = data?.map((team) => team.team_code()) || [];
  return teamCodes;
}

export function useFetchTeams() {
  return useQuery<string[], Error>({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });
}

// Fetch all columns for teams (for admin/config table view)
async function fetchAllTeams(ents?: string[]): Promise<Team[]> {
  const query = supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });
  console.log(ents, "ents data");
  if (ents && ents.length > 0) {
    query.in("team_code", ents);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
  
export function useFetchAllTeams(ents?: string[]) {
  return useQuery<Team[], Error>({
    queryKey: ["all_teams"],
    queryFn: () => fetchAllTeams(ents),
  });
}
