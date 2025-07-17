import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";






async function fetchCounts(table: string, status: string[]) {
    const { data, error } = await supabase.from(table).select("id", { count: "exact" }).in("process_status", status)
    if (error) {
        console.error(error)
    }
    console.log(data, "counts data")
    return data
}




export const useFetchCounts = (table: string, status: string[]) => {
    return useQuery({
        queryKey: ["counts", table, status],
        queryFn: () => fetchCounts(table, status),
    });
};




