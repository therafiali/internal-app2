import { useState } from "react";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import RoomCard from "./RoomCard";
import { Search } from "lucide-react";
import { useFetchChatRooms } from "~/hooks/api/queries/useFetchChatRooms";

interface ChatSidebarProps {
  onRoomSelect?: (roomId: string) => void;
  selectedRoomId?: string;
}

export default function ChatSidebar({ onRoomSelect, selectedRoomId }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: chatRooms } = useFetchChatRooms();

  // Convert real chat rooms to room format
  const rooms = (chatRooms || []).map((chatRoom) => {
    const player = chatRoom.players;
    const username = player?.username || 
                    `${player?.firstname} ${player?.lastname}`.trim() || 
                    player?.fullname || 
                    "Unknown";
    
    // Format timestamp from created_at
    const formatTimestamp = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'numeric', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
    };

    return {
      id: chatRoom.id,
      username,
      status: player?.online_status === "online" ? "online" as const : "offline" as const,
      timestamp: formatTimestamp(chatRoom.created_at),
      avatar: player?.profilepic || "",
      lastMessage: chatRoom.last_message
    };
  }).sort((a, b) => {
    // Sort online users first, then offline
    if (a.status === "online" && b.status === "offline") return -1;
    if (a.status === "offline" && b.status === "online") return 1;
    return 0;
  });

  // Filter rooms based on search query
  const filteredRooms = rooms.filter(room =>
    room.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      // Focus search input
      const searchInput = document.getElementById('room-search');
      searchInput?.focus();
    }
  };

  return (
    <div 
      className="w-80 bg-gray-900/50 border-r border-[hsl(var(--sidebar-border))] flex flex-col"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
        <h2 className="text-lg font-semibold text-white mb-4">Available Rooms</h2>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="room-search"
            type="text"
            placeholder="Search by username... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-400 focus:border-gray-600"
          />
        </div>
      </div>

      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                username={room.username}
                status={room.status}
                timestamp={room.timestamp}
                avatar={room.avatar}
                isActive={selectedRoomId === room.id}
                onClick={() => onRoomSelect?.(room.id)}
                lastMessage={room.lastMessage}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No rooms found</p>
              {searchQuery && (
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="text-sm text-gray-400">
          <span>{filteredRooms.length} chat rooms available</span>
        </div>
      </div>
    </div>
  );
} 