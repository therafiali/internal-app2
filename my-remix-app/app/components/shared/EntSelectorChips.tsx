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
    let newSelected: string[];
    if (selected.includes(team_code)) {
      newSelected = selected.filter((c) => c !== team_code);
    } else {
      newSelected = [...selected, team_code];
    }
    setSelected(newSelected);
    onChange?.(newSelected);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {loading ? (
        <span className="text-neutral-400">Loading...</span>
      ) : teams.length === 0 ? (
        <span className="text-neutral-400">No teams found.</span>
      ) : (
        teams.map((team) => (
          <Badge
            key={team.id}
            variant={selected.includes(team.team_code) ? "default" : "outline"}
            className={cn(
              "cursor-pointer select-none transition-all",
              selected.includes(team.team_code)
                ? "bg-blue-600 text-white border-blue-600"
                : "hover:bg-neutral-800 hover:border-blue-400",
              disabled && "opacity-50 pointer-events-none"
            )}
            onClick={() => handleToggle(team.team_code)}
          >
            {team.team_code.toUpperCase()}
          </Badge>
        ))
      )}
    </div>
  );
}
