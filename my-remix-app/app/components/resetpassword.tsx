import React, { useState, useRef, KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Key } from "lucide-react";
import { supabase } from "~/hooks/use-auth";

interface Player {
  id: string;
  firstname: string;
  lastname: string;
  fullname: string;
  account_id: string;
  team_code: string;
  status: string;
  profilepic?: string;
}

interface ResetPasswordModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ResetPasswordModal({
  trigger,
  open,
  onOpenChange,
}: ResetPasswordModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [playerSuggestions, setPlayerSuggestions] = useState<Player[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [platform, setPlatform] = useState("");
  const [pageName, setPageName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Mock platforms - replace with actual data from your API
  const platforms = [
    "Call of Duty",
    "Fortnite",
    "PUBG",
    "Valorant",
    "CS:GO",
    "League of Legends",
    "Apex Legends",
    "Overwatch",
  ];

  // Mock pages - replace with actual data from your API
  const pages = [
    "Account Recovery",
    "Password Reset",
    "Security Update",
    "Access Restoration",
    "Account Verification",
  ];

  // Search players function
  const searchPlayers = async (query: string) => {
    if (!query.trim()) {
      setPlayerSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("players")
        .select("id, firstname, lastname, fullname, account_id, team_code, status, profilepic")
        .or(`fullname.ilike.%${query}%,account_id.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error("Error searching players:", error);
        return;
      }

      setPlayerSuggestions(data || []);
    } catch (error) {
      console.error("Error searching players:", error);
    }
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedPlayer(null);
    setShowSuggestions(true);
    setHighlightedIndex(-1);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlayers(value);
    }, 300);
  };

  // Handle player selection
  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setSearchQuery(`${player.fullname}`);
    setShowSuggestions(false);
  };

  // Handle keyboard navigation
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || playerSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < playerSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : playerSuggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handlePlayerSelect(playerSuggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlayer || !platform || !pageName) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create password reset request
      const { data, error } = await supabase
        .from("password_reset_requests")
        .insert([
          {
            player_id: selectedPlayer.id,
            platform: platform,
            page_name: pageName,
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error("Error creating password reset request:", error);
        alert("Failed to create password reset request");
        return;
      }

      // Reset form
      setSelectedPlayer(null);
      setSearchQuery("");
      setPlatform("");
      setPageName("");
      
      // Close modal
      if (onOpenChange) {
        onOpenChange(false);
      }

      alert("Password reset request submitted successfully!");
    } catch (error) {
      console.error("Error submitting password reset request:", error);
      alert("Failed to submit password reset request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
            {trigger || <Button className="bg-gray-800 rounded-xl border border-blue-500/30 px-6 py-3 font-semibold transition-all duration-200 hover:scale-105">
                        <Key className="w-5 h-5 mr-2 text-blue-400" />
                        RESET PASSWORD
                    </Button>}
      </DialogTrigger>
      <DialogContent className="bg-[#181A20] border border-gray-700 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-blue-500" />
            <DialogTitle className="text-xl font-semibold">
              Reset Player Password
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Fill in the details to reset player password.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Player Section */}
          <div className="space-y-2">
            <Label htmlFor="player-search" className="text-sm font-medium">
              Search Player
            </Label>
            
            {selectedPlayer ? (
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    {selectedPlayer.profilepic ? (
                      <img
                        src={selectedPlayer.profilepic}
                        alt={selectedPlayer.fullname}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">
                        {selectedPlayer.firstname?.[0]}{selectedPlayer.lastname?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{selectedPlayer.fullname}</div>
                    <div className="text-xs text-gray-400">{selectedPlayer.account_id}</div>
                    <div className="text-xs text-gray-400">{selectedPlayer.team_code}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">
                    {selectedPlayer.status}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPlayer(null);
                      setSearchQuery("");
                    }}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="player-search"
                    type="text"
                    placeholder="Search by Name or Account ID"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Player Suggestions */}
                {showSuggestions && playerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {playerSuggestions.map((player, index) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => handlePlayerSelect(player)}
                        className={`w-full p-3 text-left hover:bg-gray-700 flex items-center space-x-3 ${
                          index === highlightedIndex ? "bg-gray-700" : ""
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          {player.profilepic ? (
                            <img
                              src={player.profilepic}
                              alt={player.fullname}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              {player.firstname?.[0]}{player.lastname?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{player.fullname}</div>
                          <div className="text-xs text-gray-400">{player.account_id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform" className="text-sm font-medium">
              Platform
            </Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select game platform..." />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Name Selection */}
          <div className="space-y-2">
            <Label htmlFor="page-name" className="text-sm font-medium">
              Page Name <span className="text-gray-400">(Required)</span>
            </Label>
            <Select value={pageName} onValueChange={setPageName}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select page..." />
              </SelectTrigger>
              <SelectContent>
                {pages.map((page) => (
                  <SelectItem key={page} value={page}>
                    {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !selectedPlayer || !platform || !pageName}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
            >
              <Key className="h-4 w-4" />
              <span>{isSubmitting ? "Submitting..." : "Submit"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
