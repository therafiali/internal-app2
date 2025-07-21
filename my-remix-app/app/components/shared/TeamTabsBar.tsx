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
      style={{ 
        display: "flex", 
        gap: 24, 
        background: "#222", 
        borderRadius: 16, 
        padding: 12, 
        marginBottom: 24 
      }}
      className={className}
    >
      {teams.map((team) => (
        <button
          key={team}
          onClick={() => onTeamChange(team)}
          style={{
            background: selectedTeam === team ? "#232a3b" : "transparent",
            color: selectedTeam === team ? "#3b82f6" : "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontWeight: selectedTeam === team ? 600 : 400,
            cursor: "pointer",
          }}
        >
          {team}
        </button>
      ))}
    </div>
  );
} 