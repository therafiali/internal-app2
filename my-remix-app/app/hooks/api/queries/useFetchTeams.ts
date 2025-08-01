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
    .order("created_at", { ascending: true });

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
async function fetchAllTeams(ents: string[] = ["ALL"]): Promise<Team[]> {
  const query = supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: true });
  console.log(ents, "ents data");
  if (ents && ents.length > 0 && ents[0] !== "ALL") {
    query.in("team_code", ents);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function useFetchAllTeams(ents: string[] = ["ALL"]) {
  return useQuery<Team[], Error>({
    queryKey: ["all_teams"],
    queryFn: () => fetchAllTeams(ents),
  });
}

async function fetchTeamId(teamCode: string[]) {
  console.log(teamCode, "fetchTeamId");

  // Don't fetch if no team codes provided
  if (!teamCode || teamCode.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("teams")
    .select("id")
    .in("team_code", teamCode.map((code) => code.toLowerCase()));
  if (error) throw error;
  console.log(data, "fetchTeamId data");
  return data;
}

export function useFetchTeamId(teamCode: string[]) {
  return useQuery<{ id: string }[], Error>({
    queryKey: ["team_id", teamCode], // ✅ Include teamCode in query key
    queryFn: () => fetchTeamId(teamCode),
    enabled: teamCode.length > 0, // ✅ Only run when we have team codes
  });
}
