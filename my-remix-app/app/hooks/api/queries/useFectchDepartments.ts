import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

const fetchDepartments = async () => {
  const { data, error } = await supabase.from("department").select("*");
  if (error) {
    throw error;
  }
  return data;
};

export const useFetchDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });
};
