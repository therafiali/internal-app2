import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

interface MessageBubbleProps {
  message: {
    id: string;
    body: string;
    created_at: string;
    sender_type: string;
    sender_id: string;
  };
  senderInfo?: {
    name: string;
    avatar?: string;
  };
  isCurrentUser?: boolean;
}

export default function MessageBubble({ message, senderInfo, isCurrentUser = false }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isAgent = message.sender_type === 'agent';
  const senderInitials = senderInfo?.name ? senderInfo.name.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {!isCurrentUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={senderInfo?.avatar} alt={senderInfo?.name} />
          <AvatarFallback className={cn(
            "text-xs",
            isAgent ? "bg-blue-600 text-white" : "bg-gray-600 text-white"
          )}>
            {senderInitials}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        {/* Sender Name & Time */}
        <div className={cn(
          "flex items-center gap-2 mb-1 text-xs text-gray-400",
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span className={cn(
            "font-medium",
            isAgent ? "text-blue-400" : "text-green-400"
          )}>
            {senderInfo?.name || (isAgent ? "Agent" : "Player")}
          </span>
          <span>{formatTime(message.created_at)}</span>
        </div>

        {/* Message Bubble */}
        <div className={cn(
          "px-4 py-2 rounded-lg text-sm",
          isCurrentUser
            ? "bg-blue-600 text-white"
            : isAgent
            ? "bg-gray-700 text-white"
            : "bg-gray-800 text-white"
        )}>
          {message.body}
        </div>
      </div>

      {/* Current User Avatar */}
      {isCurrentUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={senderInfo?.avatar} alt={senderInfo?.name} />
          <AvatarFallback className="bg-blue-600 text-white text-xs">
            {senderInitials}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
} 