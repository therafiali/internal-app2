import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { useFetchAllTeams } from "../../hooks/api/queries/useFetchTeams";

interface EntSelectorChipsProps {
  value?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function EntSelectorChips({
  value,
  onChange,
  disabled = false,
  className = "",
}: EntSelectorChipsProps) {
  const { data: teams = [], isLoading: loading } = useFetchAllTeams();
  const [selected, setSelected] = useState<string[]>(value || []);

  // Sync controlled value
  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  const handleToggle = (team_code: string) => {
    if (disabled) return;
    const upperTeamCode = team_code.toUpperCase();
    let newSelected: string[];
    if (selected.includes(upperTeamCode)) {
      newSelected = selected.filter((c) => c !== upperTeamCode);
    } else {
      newSelected = [...selected, upperTeamCode];
    }
    setSelected(newSelected);
    onChange?.(newSelected);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {(() => {
       
        return null;
      })()}
      {loading ? (
        <span className="text-neutral-400">Loading...</span>
      ) : teams.length === 0 ? (
        <span className="text-neutral-400">No teams found.</span>
      ) : (
        teams.map((team) => {
          const upperTeamCode = team.team_code.toUpperCase();
          return (
            <Badge
              key={team.id}
              variant={selected.includes(upperTeamCode) ? "default" : "outline"}
              className={cn(
                "cursor-pointer select-none transition-all",
                selected.includes(upperTeamCode)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "hover:bg-white-800 hover:border-blue-400 bg-gray-50/50",
                disabled && "opacity-50 pointer-events-none"
              )}
              onClick={() => handleToggle(team.team_code)}
            >
              {upperTeamCode}
            </Badge>
          );
        })
      )}
    </div>
  );
}
