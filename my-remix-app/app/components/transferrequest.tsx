import { useState, useRef, KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { supabase } from "~/hooks/use-auth";
import { useFetch } from "~/hooks/api/useFetch";
import { useFetchPaymentMethods } from "~/hooks/api/queries/useFetchPaymentMethods";
import { generateCustomID } from "~/lib/utils";
import { Plus } from "lucide-react";
import { RechargeProcessStatus, TransferRequestStatus } from "~/lib/constants";
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer";
import { useFetchGameUsernames } from "~/hooks/api/queries/useFetchGames";

interface PlayerPlatformUsername {
  id: string;
  player_id: string;
  platform: string;
  username: string;
  game_id: string;
  game_username: string;
  game: string;
}

interface Player {
  id: string;
  fullname: string;
}

export default function SupportSubmitRequest() {
  const { data: players } = useFetchPlayer();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const { data: gameUsernames } = useFetchGameUsernames(selectedPlayerId || "");

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    player: "",
    fromPlatform: "",
    toPlatform: "",
    amount: "",
    promo: "",
    page: "",
  });
  const [playerSuggestions, setPlayerSuggestions] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedFromPlatform, setSelectedFromPlatform] = useState<string>("");
  const [selectedToPlatform, setSelectedToPlatform] = useState<string>("");
  const [selectedFromUsername, setSelectedFromUsername] = useState<string>("");
  const [selectedToUsername, setSelectedToUsername] = useState<string>("");
  const [playerPlatformUsernames, setPlayerPlatformUsernames] = useState<
    PlayerPlatformUsername[]
  >([]);

 
  const {
    data: paymentMethodItems,
    isLoading,
    error,
  } = useFetchPaymentMethods();

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "player") {
      setShowSuggestions(true);
      setHighlightedIndex(-1);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (value.trim().length === 0) {
          setPlayerSuggestions([]);
          return;
        }
        const { data, error } = await supabase
          .from("players")
          .select("id, fullname")
          .ilike("fullname", `%${value}%`)
          .not("active_status", "eq", "banned")
          .limit(3);
        if (!error && data) {
          setPlayerSuggestions(
            data.map((item) => ({ id: item.id, fullname: item.fullname }))
          );
        } else {
          setPlayerSuggestions([]);
        }
      }, 300);
    }
  };

  const handlePlayerSelect = async (player: Player) => {
    setSelectedPlayerId(player.id);
    // fetch player_platfrom_usernames
    const { data, error } = await supabase
      .from("player_platfrom_usernames")
      .select("*")
      .eq("player_id", player.id);
    //   fetch games
    if (!error && data) {
      const _playerPlatformUsernames = await Promise.all(
        data.map(async (_data) => {
          const { data: game, error: gameError } = await supabase
            .from("games")
            .select("*")
            .eq("id", _data.game_id);
          return {
            ..._data,
            game: game?.[0]?.game_name || "Unknown Game",
          };
        })
      );
      
      setPlayerPlatformUsernames(_playerPlatformUsernames);
    }

    setForm((prev) => ({ ...prev, player: player.fullname }));
    setSelectedPlayer(player);
    setShowSuggestions(false);
    setPlayerSuggestions([]);
  };

  const handleSuggestionKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || playerSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) =>
        prev < playerSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : playerSuggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handlePlayerSelect(playerSuggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleFromPlatformChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setSelectedFromPlatform(value);
    setForm((prev) => ({ ...prev, fromPlatform: value }));

    // Find the selected platform and set the username
    const selectedPlatform = playerPlatformUsernames.find(
      (platform) => platform.game_id === value
    );
    if (selectedPlatform) {
      setSelectedFromUsername(selectedPlatform.id);
    }

    // If the same platform is selected in "to" field, clear it
    if (value === selectedToPlatform) {
      setSelectedToPlatform("");
      setForm((prev) => ({ ...prev, toPlatform: "" }));
      setSelectedToUsername("");
    }
  };

  const handleToPlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
   
    setSelectedToPlatform(value);
    setForm((prev) => ({ ...prev, toPlatform: value }));

    // Find the selected platform and set the username
    const selectedPlatform = playerPlatformUsernames.find(
      (platform) => platform.game_id === value
    );
    if (selectedPlatform) {
      setSelectedToUsername(selectedPlatform.id);
    }

    // If the same platform is selected in "from" field, clear it
    if (value === selectedFromPlatform) {
      setSelectedFromPlatform("");
      setForm((prev) => ({ ...prev, fromPlatform: "" }));
      setSelectedFromUsername("");
    }
  };

  // Function to reset the form
  const resetForm = () => {
    setForm({
      player: "",
      fromPlatform: "",
      toPlatform: "",
      amount: "",
      promo: "",
      page: "",
    });
    setSelectedPlayer(null);
    setSelectedFromPlatform("");
    setSelectedToPlatform("");
    setSelectedFromUsername("");
    setSelectedToUsername("");
    setPlayerPlatformUsernames([]);
    setPlayerSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedPlayer ||
      !selectedFromPlatform ||
      !selectedToPlatform ||
      !form.amount
    ) {
      return;
    }

  

    const { data: transfer_requests, error: transfer_requestsError } =
      await supabase.from("transfer_requests").insert([
        {
          transfer_id: generateCustomID("T"),
          player_id: selectedPlayer.id,
          from_platform: selectedFromPlatform,
          to_platform: selectedToPlatform,
          from_username: selectedFromUsername,
          to_username: selectedToUsername,
          amount: parseFloat(form.amount),
          process_status: TransferRequestStatus.PENDING,
        },
      ]);

    if (transfer_requestsError) {
      console.error("Insert failed:", transfer_requestsError);
    } else {
      
      setOpen(false);
      resetForm();
    }
  };

  // Filter platforms for "to" field - exclude the selected "from" platform
  const availableToPlatforms = playerPlatformUsernames.filter(
    (platform) => platform.game_id !== selectedFromPlatform
  );

  // Filter platforms for "from" field - exclude the selected "to" platform
  const availableFromPlatforms = playerPlatformUsernames.filter(
    (platform) => platform.game_id !== selectedToPlatform
  );

  return (
    <div className="">
      <Button
        className="bg-gray-800 rounded-xl border border-blue-500/30 px-6 py-3 font-semibold transition-all duration-200 hover:scale-105"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-5 h-5 mr-2 text-blue-400" />
        TRANSFER 
      </Button>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            resetForm();
          }
          setOpen(isOpen);
        }}
      >
        <DialogContent className="max-w-xl w-full bg-[#23272f] border border-gray-700 text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">
              Submit Transfer Request
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <div className="relative">
              <Label>Search Player</Label>
              <div className="relative mt-1">
                <Input
                  name="player"
                  value={form.player}
                  onChange={(e) => {
                    handleChange(e);
                  }}
                  placeholder="Search by Name or Account ID"
                  className="bg-[#18181b] border-gray-700 text-gray-100 pl-3"
                  autoComplete="off"
                  onFocus={() => form.player && setShowSuggestions(true)}
                  onKeyDown={handleSuggestionKeyDown}
                  aria-autocomplete="list"
                  aria-controls="player-suggestion-list"
                  aria-activedescendant={
                    highlightedIndex >= 0
                      ? `player-suggestion-${highlightedIndex}`
                      : undefined
                  }
                />
                {showSuggestions && playerSuggestions.length > 0 && (
                  <div
                    id="player-suggestion-list"
                    className="absolute left-0 right-0 mt-1 bg-[#23272f] border border-gray-700 rounded shadow-lg z-20"
                    role="listbox"
                  >
                    {playerSuggestions.map((player, idx) => (
                      <div
                        key={player.id}
                        id={`player-suggestion-${idx}`}
                        role="option"
                        aria-selected={highlightedIndex === idx}
                        tabIndex={0}
                        className={`px-4 py-2 cursor-pointer text-gray-100 select-none ${
                          highlightedIndex === idx
                            ? "bg-blue-700"
                            : "hover:bg-[#18181b]"
                        }`}
                        onClick={() => {
                          handlePlayerSelect(player);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            handlePlayerSelect(player);
                        }}
                      >
                        {player.fullname}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>From Platform</Label>
              <select
                name="fromPlatform"
                value={form.fromPlatform}
                onChange={handleFromPlatformChange}
                className="w-full h-9 rounded-md border border-gray-700 bg-[#18181b] px-3 py-2 text-sm text-gray-100 shadow-sm mt-1"
              >
                <option value="">Select from platform...</option>
                {availableFromPlatforms.map((platform) => (
                  <option key={platform.id} value={platform.game_id}>
                    {platform.game_username} - {platform.game}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>To Platform</Label>
              <select
                name="toPlatform"
                value={form.toPlatform}
                onChange={handleToPlatformChange}
                className="w-full h-9 rounded-md border border-gray-700 bg-[#18181b] px-3 py-2 text-sm text-gray-100 shadow-sm mt-1"
              >
                <option value="">Select to platform...</option>
                {availableToPlatforms.map((platform) => (
                  <option key={platform.id} value={platform.game_id}>
                    {platform.game_username} - {platform.game}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Transfer Amount</Label>
              <div className="relative mt-1">
                <Input
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="$ Enter amount..."
                  className="bg-[#18181b] border-gray-700 text-gray-100 pl-3"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 mt-2"
            >
              Submit Transfer Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
