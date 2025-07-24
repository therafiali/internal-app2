import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

const fetchAgentRoles = async () => {
  const { data, error } = await supabase.from("agent_roles").select("*");
  if (error) {
    throw error;
  }
  return data;
};

export const useFetchAgentRoles = () => {
  return useQuery({
    queryKey: ["agent-roles"],
    queryFn: fetchAgentRoles,
  });
};
