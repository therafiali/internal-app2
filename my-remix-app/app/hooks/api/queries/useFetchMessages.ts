import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_type: string;
  attachment_url: string | null;
  attachment_type: string | null;
  media: any[] | null;
}

async function fetchMessages(roomId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export const useFetchMessages = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ["chat_messages", roomId],
    queryFn: () => roomId ? fetchMessages(roomId) : Promise.resolve([]),
    enabled: !!roomId, // Only fetch when roomId exists
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });
}; 