import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

interface SendMessageProps {
  room_id: string;
  body: string;
  sender_id: string;
  sender_type: "agent" | "player";
}

async function sendMessage({ room_id, body, sender_id, sender_type }: SendMessageProps) {
  // Insert the message
  const { data: messageData, error: messageError } = await supabase
    .from('chat_messages')
    .insert({
      room_id,
      body,
      sender_id,
      sender_type
    })
    .select()
    .single();

  if (messageError) throw messageError;

  // Update the chat room's last_message
  const { error: roomError } = await supabase
    .from('chat_rooms')
    .update({ last_message: body })
    .eq('id', room_id);

  if (roomError) {
    console.error("Error updating room last_message:", roomError);
    // Don't throw here, message was sent successfully
  }

  return messageData;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      // Invalidate and refetch messages for this room
      queryClient.invalidateQueries({
        queryKey: ["chat_messages", data.room_id]
      });
      
      // Also invalidate chat rooms to update last_message
      queryClient.invalidateQueries({
        queryKey: ["chat_rooms"]
      });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    },
  });
}; 