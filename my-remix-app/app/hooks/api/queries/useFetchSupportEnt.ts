import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../use-auth";

export interface Team {
  ents: string[];
}

// Fetch all columns for teams (for admin/config table view)
async function fetchSupportEnt(ents: string[]): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("ents")
    .in("ents", ents)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function useFetchSupportEnt(ents?: string[]) {
  return useQuery<Team[], Error>({
    queryKey: ["all_teams"],
    queryFn: () => fetchSupportEnt(ents || []),
  });
}
