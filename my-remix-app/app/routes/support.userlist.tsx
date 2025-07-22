import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import { DynamicTable } from "~/components/shared/DynamicTable";
import TeamTabsBar from "~/components/shared/TeamTabsBar";
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer";
import { useFetchTeams } from "~/hooks/api/queries/useFetchTeams";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";


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
    header: "Referred By",
    accessorKey: "referred_by",
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
    header: "Online Status",
    accessorKey: "online_status",
  },
  {
    header: "Active Status",
    accessorKey: "active_status",
  },
];



function SupportUserList() {
  const { data: players } = useFetchPlayer();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  console.log(players,"players data");
  
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
    phone: item.phone || "N/A",
    gender: item.gender || "N/A",
    language: item.language || "N/A",
    timezone: item.timezone,
  }));  

  // Filter data by selected team
  const teamFilteredData = selectedTeam === "ALL" 
    ? allTableData 
    : allTableData.filter((item) => item.team === selectedTeam);

  // Filter data by search query
  const filteredData = searchQuery
    ? teamFilteredData.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : teamFilteredData;

  // Calculate pagination
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  // Get current page data
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredData.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Reset to first page when team changes
  const handleTeamChange = (team: string) => {
    setSelectedTeam(team);
    setCurrentPage(0);
  };

  // Handle search change
  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(0); // Reset to first page when searching
  };

  console.log(currentPageData,"table data");

  return (
    <PrivateRoute toDepartment="support">
      <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
        <DynamicHeading title="User List" />
        <TeamTabsBar
          teams={teams}
          selectedTeam={selectedTeam}
          onTeamChange={handleTeamChange}
        />
        <DynamicTable 
          columns={columns} 
          data={currentPageData}
          pagination={true}
          pageCount={totalPages}
          pageIndex={currentPage}
          limit={itemsPerPage}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          onSearchChange={handleSearchChange}
        />
      </div>
    </PrivateRoute>
  )
}

export default SupportUserList;