import React, { createContext, useContext, useState } from "react";

type TeamContextType = {
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  return (
    <TeamContext.Provider value={{ selectedTeam, setSelectedTeam }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error("useTeam must be used within a TeamProvider");
  return context;
};
