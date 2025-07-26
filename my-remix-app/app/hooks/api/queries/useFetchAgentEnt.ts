import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

async function fetchAgentEnt(id: string) {
  const query = supabase.from("users").select("ents").eq("id", id);
  const { data, error } = await query;
  if (error) throw error;
  console.log(data, "fetchAgentEnt data");
  return data || [];
}

export function useFetchAgentEnt(id: string) {
  return useQuery({
    queryKey: ["agent_ent", id],
    queryFn: () => fetchAgentEnt(id),
  });
}
