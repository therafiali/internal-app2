import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

// Centralized list of roles that should get ents from users table (not teams)
const ROLES_FROM_USERS_TABLE = [
  "agent",
  "Shift Incharge",
  "Team Lead",
  "Agent",
  "team lead",
  "shift incharge",
];

async function fetchAgentEnt(id: string) {


  // First, get the user's role from the users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("ents, role, id")
    .eq("id", id);

  
  if (userError) {
    throw userError;
  }

  // If user role is in the list of roles that should get ents from users table
  if (ROLES_FROM_USERS_TABLE.includes(userData[0].role.toLowerCase())) {
   
    const ents = userData[0].ents || [];
    // Format: Convert to array of team codes if it's not already
    return Array.isArray(ents) ? ents : [ents];
  }

  // Otherwise, get data from teams table
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("team_code")
    .order("created_at", { ascending: true });

  if (teamError) {
    throw teamError;
  }

  // Format: Extract team_code from objects to get array of strings
  return teamData?.map((team) => team.team_code) || [];
}

export function useFetchAgentEnt(id: string) {
  return useQuery({
    queryKey: ["agent_ent", id],
    queryFn: () => fetchAgentEnt(id),
    enabled: !!id, // ✅ Only run when we have a valid user ID
  });
}
