import { useQuery } from "@tanstack/react-query"
import { supabase } from "~/hooks/use-auth"

async function fetchPlayerPlatformUsernames() {
    const { data, error } = await supabase
        .from('player_platfrom_usernames')
        .select(`
            *,
            games:game_id(*),
            players:player_id(*)
        `)
    
    if (error) {
        console.error('Error fetching player platform usernames:', error)
        throw error
    }
    
    console.log('Player Platform Usernames Data:', data)
    return { data, error }
}

export const useFetchPlayerPlatformUsernames = () => {
    return useQuery({
        queryKey: ['player-platform-usernames'],
        queryFn: fetchPlayerPlatformUsernames,
    })
}
