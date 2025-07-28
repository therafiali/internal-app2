import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

interface CreatePlayerData {
  fullname: string;
  gender?: string;
  team_id: string;
  referred_by?: string;
  created_by?: string;
}

async function createPlayer(data: CreatePlayerData) {
  // First, create the player
  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      fullname: data.fullname,
      gender: data.gender || null,
      team_id: data.team_id,
      created_by: data.created_by || null,
      created_at: new Date().toISOString(),
      // Set default values for required fields
      online_status: "offline",
      active_status: "active",
    })
    .select()
    .single();

  if (playerError) {
    throw playerError;
  }

  // If there's a referral, create the referral record
  if (data.referred_by && player) {
    const { error: referralError } = await supabase
      .from("player_referral")
      .insert({
        referred_by: data.referred_by,
        referred_user_id: player.id,
        created_at: new Date().toISOString(),
      });

    if (referralError) {
      console.error("Error creating referral record:", referralError);
      // Don't throw error for referral failure, just log it
    }
  }

  return player;
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      // Invalidate and refetch players data
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (error) => {
      console.error("Error creating player:", error);
    },
  });
}
