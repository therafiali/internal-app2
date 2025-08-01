import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";



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

async function fetchPlayerByTeam(teamCode: string[]) {
    
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .in('team_id', teamCode)
        .not("active_status", "eq", "banned");
    if (error) throw error;
    
    return data;
}


export function useFetchPlayer() {
    return useQuery({
        queryKey: ['player'],
        queryFn: () => fetchPlayer(),
    });
}

export function useFetchPlayerByTeam(teamCode: string[]) {
    return useQuery({
        queryKey: ['playerByTeam', teamCode],
        queryFn: () => fetchPlayerByTeam(teamCode),
    });
}

