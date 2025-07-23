interface Room {
  id: string;
  username: string;
  status: "online" | "offline";
  timestamp: string;
  avatar: string;
  lastMessage?: string | null;
}

interface ChatSidebarProps {
  onRoomSelect: (roomId: string) => void;
  selectedRoomId?: string;
  rooms: Room[];
}

export default function ChatSidebar({ onRoomSelect, selectedRoomId, rooms }: ChatSidebarProps) {
  return (
    <div className="w-80 border-r border-gray-700 bg-gray-900 h-full">
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h2 className="text-lg font-semibold text-white">Chat Rooms</h2>
        <p className="text-sm text-gray-400">{rooms.length} conversations</p>
      </div>
      
      <div className="overflow-y-auto h-full bg-gray-900">
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => onRoomSelect(room.id)}
            className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
              selectedRoomId === room.id ? 'bg-gray-700 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                {room.avatar ? (
                  <img 
                    src={room.avatar} 
                    alt={room.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-200 font-medium">
                    {room.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                  room.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">{room.username}</h3>
                  <span className="text-xs text-gray-400">{room.timestamp}</span>
                </div>
                {room.lastMessage && (
                  <p className="text-sm text-gray-300 truncate mt-1">{room.lastMessage}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    room.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-xs text-gray-400 capitalize">{room.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {rooms.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <p>No chat rooms available</p>
          </div>
        )}
      </div>
    </div>
  );
} 