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

const paymentMethods = [
  "Cashapp",
  "Venmo",
  "Chime",
  "Strike",
  "PayPal",
  "USDC",
  "PYUSD",
];
// map the methods with id
const paymentMethodsMap = {
  Cashapp: "06db891b-1e90-4d5a-8cab-6cf0206526e7",
  Venmo: "06db891b-1e90-4d5a-8cab-6cf0206526e7",
  Chime: "0880122b-b581-4767-bf7d-79501bf01eea",
  Strike: "c2582a70-b71a-4440-917e-8e1da30a3016",
  PayPal: "ab537b6f-7feb-4657-8578-a9ba88ded4f2",
  USDC: "3669c422-f5a3-4b2d-8415-367e47eda70b",
  PYUSD: "c3b0ca1f-e5a3-463d-91b0-b030f429468b",
};

interface PlayerPlatformUsername {
  id: string;
  player_id: string;
  platform: string;
  username: string;
}

interface Player {
  id: string;
  name: string;
}

export default function SupportSubmitRequest() {
  const [open, setOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [form, setForm] = useState({
    player: "",
    platform: "",
    amount: "",
    promo: "",
    page: "",
  });
  const [playerSuggestions, setPlayerSuggestions] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlayerPlatformUsername | null>(null);
  const [playerPlatformUsernames, setPlayerPlatformUsernames] = useState<
    PlayerPlatformUsername[]
  >([]);

  const {
    data: paymentMethodItems,
    isLoading,
    error,
  } = useFetchPaymentMethods();
  console.log(paymentMethodItems, "paymentMethodItems");

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
          .limit(3);
        if (!error && data) {
          setPlayerSuggestions(data as Player[]);
        } else {
          setPlayerSuggestions([]);
        }
      }, 300);
    }
  };

  const handlePlayerSelect = async (player: Player) => {
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
            game: game[0].game_name,
          };
        })
      );
      console.log(_playerPlatformUsernames, "playerPlatformUsernames");
      setPlayerPlatformUsernames(_playerPlatformUsernames);
    }

    setForm((prev) => ({ ...prev, player: player.name }));
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = {
      ...form,
      paymentMethod: selectedPayment,
    };
    // You can now use 'data' to insert into your DB
    //
    console.log(
      "Submit Recharge Request Data:",
      // data,
      selectedPlayer,
      selectedPlatform
    );
 
    const { data: rechargeData, error: rechargeError } = await supabase
      .from("recharge_requests")
      .insert([
        {
          recharge_id: generateCustomID("L"),
          player_id: selectedPlayer?.id,
          team_id: selectedPlayer?.team_id,
          game_id: selectedPlatform,
          // player_platfrom_username_id: selectedPlatform,
          amount: data.amount,
          process_status: "submitted",
          payment_method_id: selectedPayment,
          // screenshot_url: { url: "https://example.com/screenshot.png" }, // JSONB
          notes: "Recharge for July tournament.",
          identifier: "TXN-JULY-2025",
          target_id: "TARGET-USER-001",
        },
      ]);

    if (rechargeError) {
      console.error("Insert failed:", rechargeError);
    } else {
      console.log("Insert successful:", rechargeData);
    }

    // Optionally close modal or reset form here
  };

  return (
    <div className="">
      <Button
        className="bg-gray-800 rounded-xl border border-blue-500/30 px-6 py-3 font-semibold transition-all duration-200 hover:scale-105"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-5 h-5 mr-2 text-blue-400" />
        RECHARGE REQUEST

      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl w-full bg-[#23272f] border border-gray-700 text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">
              Submit Recharge Request
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
                          setSelectedPlayer(player);
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
              <Label>Game Platform</Label>
              <select
                name="platform"
                value={form.platform}
                onChange={(e) => {
                  handleChange(e);
                  setSelectedPlatform(e.target.value);
                }}
                className="w-full h-9 rounded-md border border-gray-700 bg-[#18181b] px-3 py-2 text-sm text-gray-100 shadow-sm mt-1"
              >
                <option value="">Select game platform...</option>

                {playerPlatformUsernames.map((platform) => (
                  <option key={platform.id} value={platform.game_id}>
                    {platform.game_username} - {platform.game}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Deposit Amount</Label>
              <div className="relative mt-1">
                <Input
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="$ Enter amount..."
                  className="bg-[#18181b] border-gray-700 text-gray-100 pl-3"
                  type="number"
                />
              </div>
            </div>
            <div>
              <Label>Deposit Payment Methods</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {paymentMethodItems?.map((method) => (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => {
                      console.log(method.id, "method.id");
                      setSelectedPayment(method.id);
                    }}
                    className={`flex items-center justify-center border rounded-lg p-3 transition text-gray-100 font-semibold text-base
                      ${
                        selectedPayment === method.id
                          ? "bg-blue-700 border-blue-500"
                          : "bg-[#18181b] border-gray-700 hover:bg-[#23272f]"
                      }
                      `}
                  >
                    {method.payment_method}
                  </button>
                ))}
              </div>
              {selectedPayment && (
                <div className="text-xs text-blue-400 mt-1">
                  Selected: {selectedPayment}
                </div>
              )}
            </div>
            {/* <div>
              <Label>Promo Code</Label>
              <div className="flex gap-2 mb-1">
                <Button
                  type="button"
                  size="sm"
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
                  Fetch Promo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-gray-700 hover:bg-gray-800 text-white"
                >
                  Referral Bonus
                </Button>
              </div>
              <Input
                name="promo"
                value={form.promo}
                onChange={handleChange}
                placeholder="No promotions available"
                className="bg-[#18181b] border-gray-700 text-gray-400"
              />
            </div> */}
            {/*<div>
              <Label>Page Name</Label>
              <select
                name="page"
                value={form.page}
                onChange={handleChange}
                className="w-full h-9 rounded-md border border-gray-700 bg-[#18181b] px-3 py-2 text-sm text-gray-100 shadow-sm mt-1"
              >
                <option value="">Select page...</option>
                <option value="page1">Page 1</option>
                <option value="page2">Page 2</option>
              </select>
            </div>*/}
            <Button
              //   type="submit"
              onClick={handleSubmit}
              className="w-full bg-blue-700 hover:bg-blue-800 mt-2"
            >
              Submit Recharge Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
