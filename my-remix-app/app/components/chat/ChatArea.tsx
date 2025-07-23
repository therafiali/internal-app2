import { MessageCircle } from "lucide-react";
import { useFetchMessages } from "~/hooks/api/queries/useFetchMessages";
import { useSendMessage } from "~/hooks/api/mutations/useSendMessage";
import MessageList from "./MessageList";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Send } from "lucide-react";

interface ChatAreaProps {
  selectedRoomId?: string;
  selectedRoom?: {
    id: string;
    username: string;
    status: "online" | "offline";
  };
}

export default function ChatArea({ selectedRoomId, selectedRoom }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState("");
  const { data: messages, isLoading } = useFetchMessages(selectedRoomId);
  const sendMessageMutation = useSendMessage();

  // Empty state when no room is selected
  if (!selectedRoomId || !selectedRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-6">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Select a Room</h2>
            <p className="text-gray-400 text-lg">
              Choose a room from the list to start chatting
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoomId) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        room_id: selectedRoomId,
        body: newMessage.trim(),
        sender_id: "current-agent-id", // TODO: Get from auth context
        sender_type: "agent"
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Chat interface with real messages
  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-700 bg-gray-800">
        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium">
            {selectedRoom.username.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-white font-semibold">{selectedRoom.username}</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              selectedRoom.status === 'online' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`text-xs capitalize ${
              selectedRoom.status === 'online' ? 'text-green-400' : 'text-red-400'
            }`}>
              {selectedRoom.status}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <MessageList 
        messages={messages || []}
        playerInfo={{
          name: selectedRoom.username,
          avatar: selectedRoom.avatar
        }}
        currentUserId="current-agent-id" // TODO: Get from auth context
        loading={isLoading}
      />

      {/* Message Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400 focus:border-gray-600"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
          >
            {sendMessageMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
} 