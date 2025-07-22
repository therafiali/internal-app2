import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import StatusDot from "./StatusDot";
import { cn } from "~/lib/utils";

interface RoomCardProps {
  username: string;
  status: "online" | "offline";
  timestamp: string;
  avatar?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  lastMessage?: string;
}

export default function RoomCard({
  username,
  status,
  timestamp,
  avatar,
  isActive = false,
  onClick,
  className,
  lastMessage
}: RoomCardProps) {
  const userInitials = username.slice(0, 2).toUpperCase();

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 hover:bg-gray-700/50 border-gray-700/50",
        "bg-gray-800/30 backdrop-blur-sm",
        isActive && "bg-gray-700/70 border-gray-600",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with Status */}
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatar} alt={username} />
            <AvatarFallback className="bg-gray-600 text-white text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <StatusDot 
            status={status} 
            className="absolute -bottom-0.5 -right-0.5 border-2 border-gray-800" 
          />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium truncate">{username}</span>
            <StatusDot status={status} className="w-2 h-2" />
            <span className={cn(
              "text-xs capitalize",
              status === "online" ? "text-green-400" : "text-red-400"
            )}>
              {status}
            </span>
          </div>
          
          {/* Last Message */}
          {lastMessage && (
            <p className="text-sm text-gray-400 truncate mt-1">
              {lastMessage}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="bg-green-600/20 text-green-400 text-xs">
              Active
            </Badge>
            <span className="text-xs text-gray-400">{timestamp}</span>
          </div>
        </div>
      </div>
    </Card>
  );
} 