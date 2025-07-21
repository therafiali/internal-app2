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
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";


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

const entOptions = [
  { label: "ALL ENT", value: "all" },
  { label: "ENT-1", value: "ent-1" },
  { label: "ENT-2", value: "ent-2" },
  { label: "ENT-3", value: "ent-3" },
];

const columns = [
  {
    header: "Team",
    accessorKey: "team",
  },
  {
    header: "Player Name",
    accessorKey: "fullname",
  },
  {
    header: "Username",
    accessorKey: "username",
  },
  {
    header: "Online Status",
    accessorKey: "online_status",
  },
  {
    header: "Referred By",
    accessorKey: "referred_by",
  },
  {
    header: "Active Status",
    accessorKey: "active_status",
  },
  {
    header: "Last Login",
    accessorKey: "last_login",
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
  const [selectedEnt, setSelectedEnt] = useState("all");
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
    team: (item.teams?.team_code || "N/A").toUpperCase(),
    username: item.username || "N/A",
    online_status: item.online_status || "N/A",
    referred_by: item.referred_by || "N/A",
    active_status: item.active_status || "N/A",
    last_login: item.last_login || "N/A",
    fullname: item.firstname && item.lastname
      ? `${item.firstname} ${item.lastname}`.trim()
      : item.firstname || item.fullname || "N/A",
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