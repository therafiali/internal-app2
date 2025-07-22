import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import PrivateRoute from "~/components/private-route";
import ChatSidebar from "~/components/chat/ChatSidebar";
import ChatArea from "~/components/chat/ChatArea";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useFetchChatRooms } from "~/hooks/api/queries/useFetchChatRooms";

export default function SupportChat() {
  const navigate = useNavigate();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
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

  const selectedRoom = rooms.find(room => room.id === selectedRoomId);
  const activePlayersCount = rooms.filter(room => room.status === "online").length;

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleBack = () => {
    navigate("/support/userlist"); // or wherever they came from
  };

  return (
    <PrivateRoute toDepartment="support">
      <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBack}
              className="text-gray-400 hover:text-white p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Agent Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{activePlayersCount} active players</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-500">Online</span>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex h-[calc(100vh-80px)]">
          <ChatSidebar 
            onRoomSelect={handleRoomSelect}
            selectedRoomId={selectedRoomId}
          />
          <ChatArea 
            selectedRoomId={selectedRoomId}
            selectedRoom={selectedRoom}
          />
        </div>
      </div>
    </PrivateRoute>
  );
} 
