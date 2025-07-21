import { AppLayout } from "~/components/layout";
import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import { DynamicTable } from "~/components/shared/DynamicTable";
import TeamTabsBar from "~/components/shared/TeamTabsBar";
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer";
import { useFetchTeams } from "~/hooks/api/queries/useFetchTeams";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useNavigate } from "@remix-run/react";
// import { useFetchPlayerCount } from "~/hooks/api/queries/useFetchPlayer";

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Define the row type to match the table structure
type PlayerRow = {
  id: string;
  fullname: string;
  team: string;
  phone: string;
  gender?: string;
  language?: string;
  timezone?: string | null;
};

const columns = [
  {
    header: "Player Name",
    accessorKey: "fullname",
  },
  {
    header: "Team",
    accessorKey: "team",
  },
  {
    header: "Phone",
    accessorKey: "phone",
  },
  {
    header: "Gender",
    accessorKey: "gender",
  },
  {
    header: "Language",
    accessorKey: "language",
  },
];



function SupportUserList() {
  const { data: players } = useFetchPlayer();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  console.log(players,"players data");
  const pageCount = Math.ceil((50) / 10);
  
  // Fetch teams dynamically from database and replace "All Teams" with "ALL"
  const { data: rawTeams = ["All Teams"] } = useFetchTeams();
  const teams = rawTeams.map(team => team === "All Teams" ? "ALL" : team);
  
  const handleRowClick = (row: PlayerRow) => {
    const slug = createSlug(row.fullname);
    navigate(`/support/user/${slug}`);
  };

  const allTableData: PlayerRow[] = (players || []).map((item) => ({
    id: item.id,
    fullname: item.firstname && item.lastname
      ? `${item.firstname} ${item.lastname}`.trim()
      : item.firstname || item.fullname || "N/A",
    team: (item.teams?.team_code || "N/A").toUpperCase(),
    phone: item.phone || "N/A",
    gender: item.gender || "N/A",
    language: item.language || "N/A",
    timezone: item.timezone,
  }));  

  // Filter data by selected team
  const tableData = selectedTeam === "ALL" 
    ? allTableData 
    : allTableData.filter((item) => item.team === selectedTeam);

  console.log(tableData,"table data");

  return (
    <PrivateRoute toDepartment="support">
      <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
        <DynamicHeading title="User List" />
        <TeamTabsBar
          teams={teams}
          selectedTeam={selectedTeam}
          onTeamChange={(team) => {
            setSelectedTeam(team);
          }}
        />
        <DynamicTable 
          columns={columns} 
          data={tableData} 
          pagination={true}
          pageCount={pageCount}
          pageIndex={0}
          limit={10}
          onRowClick={handleRowClick}
        />
      </div>
    </PrivateRoute>
  )
}

export default SupportUserList;