import { useEffect, useRef } from "react";
import { ScrollArea } from "~/components/ui/scroll-area";
import MessageBubble from "./MessageBubble";
import { MessageCircle } from "lucide-react";

interface Message {
  id: string;
  body: string;
  created_at: string;
  sender_type: string;
  sender_id: string;
}

interface MessageListProps {
  messages: Message[];
  playerInfo?: {
    name: string;
    avatar?: string;
  };
  currentUserId?: string;
  loading?: boolean;
}

export default function MessageList({ messages, playerInfo, currentUserId, loading }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No messages yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Start the conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
      <div className="py-4">
        {messages.map((message) => {
          const isCurrentUser = message.sender_id === currentUserId;
          const isAgent = message.sender_type === 'agent';
          
          // Determine sender info
          const senderInfo = isAgent 
            ? { name: "Agent", avatar: "" }
            : playerInfo || { name: "Player", avatar: "" };

          return (
            <MessageBubble
              key={message.id}
              message={message}
              senderInfo={senderInfo}
              isCurrentUser={isCurrentUser}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
} 