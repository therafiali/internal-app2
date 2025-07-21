import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

interface PlayerPlatformUsernameData {
    player_id: string;
    game_id: string;
    game_username: string;
}

async function savePlayerPlatformUsername(data: PlayerPlatformUsernameData) {
    // First check if a record already exists
    const { data: existingRecord, error: checkError } = await supabase
        .from('player_platfrom_usernames')
        .select('*')
        .eq('player_id', data.player_id)
        .eq('game_id', data.game_id)
        .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking existing record:', checkError);
        throw checkError;
    }

    let result;
    
    if (existingRecord) {
        // Update existing record
        const { data: updateResult, error: updateError } = await supabase
            .from('player_platfrom_usernames')
            .update({ game_username: data.game_username })
            .eq('player_id', data.player_id)
            .eq('game_id', data.game_id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating player platform username:', updateError);
            throw updateError;
        }
        
        result = updateResult;
    } else {
        // Insert new record
        const { data: insertResult, error: insertError } = await supabase
            .from('player_platfrom_usernames')
            .insert([data])
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting player platform username:', insertError);
            throw insertError;
        }
        
        result = insertResult;
    }

    console.log('Successfully saved player platform username:', result);
    return result;
}

export const useSavePlayerPlatformUsername = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: savePlayerPlatformUsername,
        onSuccess: (data, variables) => {
            // Invalidate and refetch the game usernames for this player
            queryClient.invalidateQueries({
                queryKey: ['game-usernames', variables.player_id]
            });
            
            // Also invalidate the all player platform usernames query
            queryClient.invalidateQueries({
                queryKey: ['player-platform-usernames']
            });
        },
        onError: (error) => {
            console.error('Mutation failed:', error);
        }
    });
}; 