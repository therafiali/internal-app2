import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useFetchAllGames } from "~/hooks/api/queries/useFetchGames";
import { useFetchGameUsernames } from "~/hooks/api/queries/useFetchGames";
import { useSavePlayerPlatformUsername } from "~/hooks/api/mutations/useSavePlayerPlatformUsername";
import { toast } from "sonner";

interface EditGameUsernamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
}

interface Game {
  id: string;
  game_name: string;
  created_at: string;
}

interface PlayerGameUsername {
  id: string;
  player_id: string;
  game_id: string;
  game_username: string;
  created_at: string;
  games: Game;
}

export default function EditGameUsernamesModal({ 
  isOpen, 
  onClose, 
  playerId 
}: EditGameUsernamesModalProps) {
  const { data: gamesData } = useFetchAllGames();
  const { data: playerGameUsernames } = useFetchGameUsernames(playerId);
  const saveMutation = useSavePlayerPlatformUsername();
  
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize usernames from existing data
  useEffect(() => {
    if (playerGameUsernames?.data && gamesData?.data) {
      const initialUsernames: Record<string, string> = {};
      
      // Set existing usernames
      playerGameUsernames.data.forEach((item: PlayerGameUsername) => {
        initialUsernames[item.game_id] = item.game_username;
      });
      
      // Set empty strings for games without usernames
      gamesData.data.forEach((game: Game) => {
        if (!initialUsernames[game.id]) {
          initialUsernames[game.id] = "";
        }
      });
      
      setUsernames(initialUsernames);
    }
  }, [playerGameUsernames?.data, gamesData?.data]);

  const handleInputChange = (gameId: string, value: string) => {
    setUsernames(prev => ({
      ...prev,
      [gameId]: value
    }));
  };

  const handleSave = async () => {
    if (!playerId) {
      toast.error("Player ID is required");
      return;
    }

    setIsLoading(true);
    
    try {
      // Save only non-empty usernames
      const savePromises = Object.entries(usernames)
        .filter(([_, username]) => username.trim() !== "")
        .map(([gameId, username]) => 
          saveMutation.mutateAsync({
            player_id: playerId,
            game_id: gameId,
            game_username: username.trim()
          })
        );

      await Promise.all(savePromises);
      
      toast.success("Game usernames saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving usernames:", error);
      toast.error("Failed to save game usernames");
    } finally {
      setIsLoading(false);
    }
  };

  const getGameName = (gameId: string) => {
    return gamesData?.data?.find((game: Game) => game.id === gameId)?.game_name || "Unknown Game";
  };

  const getExistingUsername = (gameId: string) => {
    return playerGameUsernames?.data?.find((item: PlayerGameUsername) => item.game_id === gameId)?.game_username || "";
  };

  if (!gamesData?.data) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">
              Edit Game Usernames
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-400">
            Loading games...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">
            Edit Game Usernames
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {gamesData.data.map((game: Game) => {
            const existingUsername = getExistingUsername(game.id);
            const hasExistingData = existingUsername !== "";
            
            return (
              <div key={game.id} className="space-y-2">
                <Label htmlFor={game.id} className="text-white text-sm font-medium flex items-center gap-2">
                  {game.game_name}
                  {hasExistingData && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      Existing
                    </span>
                  )}
                </Label>
                <Input
                  id={game.id}
                  value={usernames[game.id] || ""}
                  onChange={(e) => handleInputChange(game.id, e.target.value)}
                  placeholder={`Enter ${game.game_name} username...`}
                  className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 ${
                    hasExistingData ? 'border-green-500' : ''
                  }`}
                />
                {hasExistingData && (
                  <p className="text-xs text-green-400">
                    Current: {existingUsername}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="bg-gray-600 text-white border-gray-500 hover:bg-gray-500"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 