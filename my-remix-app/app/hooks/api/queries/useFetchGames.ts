import { useQuery } from "@tanstack/react-query"
import { supabase } from "~/hooks/use-auth"

async function fetchGameUsernames(playerId: string) {
    const { data, error } = await supabase.from('player_platfrom_usernames')
    .select(`
        *,
        games:game_id(*)
    `)
    .eq("player_id", playerId);
    return { data, error }
}

export const useFetchGameUsernames = (playerId: string) => {
    return useQuery({
        queryKey: ['game-usernames', playerId],
        queryFn: () => fetchGameUsernames(playerId),
    })
}

// New hook to fetch all games
async function fetchAllGames() {
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('game_name');
    
    if (error) {
        console.error('Error fetching games:', error);
        throw error;
    }
    
    return { data, error };
}

export const useFetchAllGames = () => {
    return useQuery({
        queryKey: ['all-games'],
        queryFn: fetchAllGames,
    });
}