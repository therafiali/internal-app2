import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

interface ChatRoom {
  id: string;
  type: string;
  team_code: string | null;
  created_at: string;
  last_message: string | null;
  opened_by: any;
  player_id: string;
  players?: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    fullname: string;
    profilepic: string;
    online_status: string;
  };
}

async function fetchChatRooms(): Promise<ChatRoom[]> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select(`
      id,
      type,
      team_code,
      created_at,
      last_message,
      opened_by,
      player_id,
      players: player_id (
        id,
        username,
        firstname,
        lastname,
        fullname,
        profilepic,
        online_status
      )
    `);
  
  if (error) throw error;
  return data || [];
}

export const useFetchChatRooms = () => {
  return useQuery({
    queryKey: ["chat_rooms"],
    queryFn: fetchChatRooms,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}; 