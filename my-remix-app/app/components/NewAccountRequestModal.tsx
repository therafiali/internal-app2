import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer";
import { useFetchAllGames, useFetchGameUsernames } from "~/hooks/api/queries/useFetchGames";
import { supabase } from "~/hooks/use-auth";
import { NewAccountProcessStatus } from "~/lib/constants";
import { Plus } from "lucide-react";
import { generateCustomID } from "~/lib/utils";

interface NewAccountRequestModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: { playerId: string; gameId: string }) => void;
  children?: React.ReactNode;
}

interface Player {
  id: string;
  fullname: string;
  teams?: {
    team_code: string;
  };
}

interface Game {
  id: string;
  game_name: string;
}

interface PlayerGameUsername {
  game_id: string;
  games: {
    id: string;
    game_name: string;
  };
}

export default function NewAccountRequestModal({
  open,
  onOpenChange,
  onSubmit,
  children,
}: NewAccountRequestModalProps) {
  const form = useForm<{ playerId: string; gameId: string }>({
    defaultValues: { playerId: "", gameId: "" },
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  // Fetch data
  const { data: players = [] } = useFetchPlayer();
  console.log("PLAYERS FROM DB:", players);
  const { data: allGames = [] } = useFetchAllGames();
  const { data: playerGameUsernames = { data: [] } } = useFetchGameUsernames(selectedPlayer?.id || "");

  console.log("ALL GAMES:", allGames);
  console.log("ALL GAMES TYPE:", typeof allGames, Array.isArray(allGames));
  console.log("PLAYER GAME USERNAMES:", playerGameUsernames);

  // Filter players based on search term
  const filteredPlayers = players?.filter((player: Player) =>
    player.fullname && player.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Helper to check if player has account for a game
  const getPlayerGameUsername = (gameId: string) => {
    return playerGameUsernames?.data?.find((item: any) => item.game_id === gameId);
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    form.setValue("playerId", player.id);
    setSearchTerm(player.fullname);
    setShowPlayerDropdown(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedPlayer(null);
    setShowPlayerDropdown(value.length > 0);
  };

  const handleFormSubmit = async (data: { playerId: string; gameId: string }) => {
    if (!selectedPlayer) {
      setErrorMsg("Please select a player");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.from("player_platfrom_usernames").insert({
        account_id: generateCustomID("A"),
        player_id: data.playerId,
        game_id: data.gameId,
        process_status: NewAccountProcessStatus.PENDING,
      });

      if (error) {
        setErrorMsg(error.message || "Failed to create new account request");
      } else {
        setSuccessMsg("New account request created successfully!");
        onSubmit && onSubmit(data);
        if (onOpenChange) onOpenChange(false);
        form.reset({ playerId: "", gameId: "" });
        setSelectedPlayer(null);
        setSearchTerm("");
      }
    } catch (error) {
      setErrorMsg("An error occurred while creating the request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      {!children && (
        <DialogTrigger asChild>
          <Button className="bg-gray-800 rounded-xl border border-blue-500/30 px-6 py-3 font-semibold transition-all duration-200 hover:scale-105">
            <Plus className="w-5 h-5 mr-2 text-blue-400" />
            NEW ACCOUNT
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Create New Account Request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            {/* Player Search */}
            <div className="space-y-2">
              <Label htmlFor="player-search" className="text-white">Search Player</Label>
              <div className="relative">
                <Input
                  id="player-search"
                  placeholder="Search for a player..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowPlayerDropdown(searchTerm.length > 0)}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
                {showPlayerDropdown && filteredPlayers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredPlayers.map((player: Player) => (
                      <div
                        key={player.id}
                        className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-white border-b border-gray-600 last:border-b-0"
                        onClick={() => handlePlayerSelect(player)}
                      >
                        {player.fullname}
                        {player.teams && (
                          <span className="text-sm text-gray-400 ml-2">
                            ({player.teams.team_code})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Game Platform Selection */}
            {selectedPlayer ? (
              <div className="space-y-2">
                <Label className="text-white">Game Platform</Label>
                <div className="flex flex-col gap-2">
                  {(Array.isArray(allGames?.data) ? allGames.data : []).map((game: Game) => {
                    const playerGame = getPlayerGameUsername(game.id);
                    if (playerGame) {
                      // Player already has account for this game
                      return (
                        <div key={game.id} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2 opacity-60 cursor-not-allowed border border-gray-600">
                          <span className="text-gray-400">{game.game_name}</span>
                          <span className="text-xs text-gray-500">{playerGame.game_username || "(No username)"}</span>
                        </div>
                      );
                    } else {
                      // Player does not have account for this game
                      return (
                        <button
                          key={game.id}
                          type="button"
                          className={`flex items-center justify-between border border-gray-600 rounded px-3 py-2 hover:bg-gray-700 transition cursor-pointer bg-gray-800 text-white`}
                          onClick={() => form.setValue("gameId", game.id)}
                        >
                          <span>{game.game_name}</span>
                          {form.watch("gameId") === game.id && (
                            <span className="text-xs text-blue-400 font-semibold">Selected</span>
                          )}
                        </button>
                      );
                    }
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                Please select a player first to see available games
              </div>
            )}

            {errorMsg && <div className="text-red-400 text-sm">{errorMsg}</div>}
            {successMsg && (
              <div className="text-green-400 text-sm">{successMsg}</div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={loading || !selectedPlayer} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Creating..." : "Create Request"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="bg-gray-700 hover:bg-gray-600 text-white">
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 