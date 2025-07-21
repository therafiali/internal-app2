import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

interface Player {
    id: string;
    first_name: string;
    last_name: string;
}







async function fetchPlayer() {
    const { data, error } = await supabase
        .from('players')
        .select(`
            *,
            teams: team_id (
                team_code
            )
        `)
    if (error) throw error;
    return data;
}



export function useFetchPlayer() {
    return useQuery({
        queryKey: ['player'],
        queryFn: () => fetchPlayer(),
    });
}
