interface TeamTabsBarProps {
  teams: string[];
  selectedTeam: string;
  onTeamChange: (team: string) => void;
  className?: string;
}

export default function TeamTabsBar({ 
  teams, 
  selectedTeam, 
  onTeamChange, 
  className = "" 
}: TeamTabsBarProps) {
  return (
    <div 
      className={`flex gap-6 bg-gray-900 border border-gray-700 rounded-lg p-3 mb-6 ${className}`}
    >
      {teams.map((team) => (
        <button
          key={team}
          onClick={() => onTeamChange(team)}
          className={`
            px-4 py-2 rounded-md font-medium uppercase cursor-pointer border-none transition-all duration-200
            ${selectedTeam === team 
              ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] font-semibold' 
              : 'bg-transparent text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'
            }
          `}
        >
          {team}
        </button>
      ))}
    </div>
  );
} 