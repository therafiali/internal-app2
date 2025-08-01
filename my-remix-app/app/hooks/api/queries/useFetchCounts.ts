import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

async function fetchCounts(table: string, status: string[], team?: string[]) {
  // Step 1: Get team IDs from teams table using team codes
  let teamIds: string[] = [];

  if (team && team.length > 0) {
   

    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id")
      .in(
        "team_code",
        team.map((item) => item.toLowerCase())
      );

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      return null;
    }

    

    if (teamsData && teamsData.length > 0) {
      teamIds = teamsData.map((item) => item.id);
     
    }
  }

  // Step 2: Get counts from the target table using team IDs
  let query = supabase
    .from(table)
    .select("id", { count: "exact" })
    .in("process_status", status);

  if (teamIds.length > 0) {
    query = query.in("team_id", teamIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching counts:", error);
    return null;
  }

 
  return data;
}

export const useFetchCounts = (
  table: string,
  status: string[],
  team?: string[]
) => {
  return useQuery({
    queryKey: ["counts", table, status, team],
    queryFn: () => fetchCounts(table, status, team),
  });
};
