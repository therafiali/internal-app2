import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import { DynamicTable } from "~/components/shared/DynamicTable";
import TeamTabsBar from "~/components/shared/TeamTabsBar";
import UserActivityModal from "~/components/shared/UserActivityModal";
import { UserStatusWarningDialog } from "~/components/shared/UserStatusWarningDialog";
import { SearchBar } from "~/components/shared/SearchBar";
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer";
import { Button } from "~/components/ui/button";

import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { supabase, useAuth } from "~/hooks/use-auth";
import { useFetchAgentEnt } from "~/hooks/api/queries/useFetchAgentEnt";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

type PlayerRow = {
  id: string;
  fullname: string;
  team: string;
  phone: string;
  username?: string;
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
    header: "User",
    accessorKey: "fullname",
  },
  {
    header: "Account ID",
    accessorKey: "username",
  },
  // {
  //   header: "Referred By",
  //   accessorKey: "referred_by",
  // },
  // {
  //   header: "Last Login",
  //   accessorKey: "last_login",
  // },
  // {
  //   header: "Gender",
  //   accessorKey: "gender",
  // },
  {
    header: "Online Status",
    accessorKey: "online_status",
  },
  {
    header: "Active Status",
    accessorKey: "active_status",
  },
  {
    header: "Action",
    accessorKey: "action",
  },
];

function SupportUserList() {
  const { user } = useAuth();
  const { data: players } = useFetchPlayer();
  const { data: agentEnt } = useFetchAgentEnt(user?.id || "");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [userActivityModalOpen, setUserActivityModalOpen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    fullname: string;
    currentStatus: string;
  } | null>(null);
  const [isProcessingStatus, setIsProcessingStatus] = useState(false);

  console.log(agentEnt, "agentEnt");

  // Get teams from agentEnt data and add "ALL" option
  const teamsFromEnts = agentEnt || [];
  const teams = ["ALL", ...teamsFromEnts];

  console.log(teamsFromEnts, "teamsFromEnts");

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
    active_status: item.active_status.charAt(0).toUpperCase() + item.active_status.slice(1) || "N/A",
    last_login: item.last_login || "N/A",
    fullname:
      item.firstname && item.lastname
        ? `${item.firstname} ${item.lastname}`.trim()
        : item.firstname || item.fullname || "N/A",
    phone: item.phone || "N/A",
    gender: item.gender || "N/A",
    language: item.language || "N/A",
    timezone: item.timezone,
    action: (
      user?.user_metadata?.role === "executive" && item.active_status === "banned" ? (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation(); // Prevent row click when button is clicked
          handleStatusChangeClick({
            id: item.id,
            fullname: item.fullname,
            currentStatus: item.active_status,
          });
        }}
      >
        {item.active_status === "banned" ? "Active" : "Ban"}
      </Button>
      ) : (
        <Button
          disabled={item.active_status === "banned"}
          className="bg-red-500 text-white"
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click when button is clicked
          }}
        >
          {item.active_status === "banned" ? "Active" : "Ban"}
        </Button>
      )
    ),
  }));

  // Normalize teamsFromEnts to uppercase for comparison
  const teamsFromEntsUpper = Array.isArray(teamsFromEnts)
    ? teamsFromEnts.map((t: string) => t.toUpperCase())
    : [];

  // Filter data by access
  const accessibleTableData = allTableData.filter((item) =>
    teamsFromEntsUpper.includes(item.team)
  );

  // Filter data by selected team
  const teamFilteredData =
    selectedTeam === "ALL"
      ? accessibleTableData
      : accessibleTableData.filter(
          (item) => item.team.toUpperCase() === selectedTeam.toUpperCase()
        );

  // Filter data by search query
  const filteredData = searchQuery
    ? teamFilteredData.filter(
        (row) =>
          row.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.team?.toLowerCase().includes(searchQuery.toLowerCase())
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

  console.log(selectedTeam, "selectedTeam");

  // Handle search change
  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(0); // Reset to first page when searching
  };

  // Handle user activity modal submission
  const handleUserActivitySubmit = async (data: {
    fullname: string;
    gender?: string;
    teamId: string;
    referred_by?: string;
  }) => {
    console.log("Player created:", data);
    // Refresh the players data after successful submission
    await queryClient.invalidateQueries({ queryKey: ["player"] });
    await queryClient.refetchQueries({ queryKey: ["player"] });
  };

  // Handle status change with warning dialog
  const handleStatusChangeClick = (user: {
    id: string;
    fullname: string;
    currentStatus: string;
  }) => {
    setSelectedUser(user);
    setWarningDialogOpen(true);
  };

  // Handle confirmation of status change
  const handleStatusChangeConfirm = async () => {
    if (!selectedUser) return;

    setIsProcessingStatus(true);
    try {
      const newStatus =
        selectedUser.currentStatus === "banned" ? "active" : "banned";

      await supabase
        .from("players")
        .update({
          active_status: newStatus,
        })
        .eq("id", selectedUser.id);

      // Invalidate and refetch the players data
      await queryClient.invalidateQueries({ queryKey: ["player"] });
      await queryClient.refetchQueries({ queryKey: ["player"] });
      setWarningDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user status:", error);
    } finally {
      setIsProcessingStatus(false);
    }
  };

  console.log(currentPageData, "table data");

  return (
    <PrivateRoute toDepartment="support">
      <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
        <div className="flex justify-between items-center mb-6">
          <DynamicHeading title="User List" />
        </div>
        <TeamTabsBar
          teams={teams as string[]}
          selectedTeam={selectedTeam}
          onTeamChange={handleTeamChange}
        />
        <UserActivityModal
          open={userActivityModalOpen}
          onOpenChange={setUserActivityModalOpen}
          onSubmit={handleUserActivitySubmit}
        >
          <Button className="bg-blue-500 text-white" variant="default">
            <Plus /> New Player
          </Button>
        </UserActivityModal>
        <SearchBar
          placeholder="Search by player name or recharge ID..."
          value={searchQuery}
          onChange={handleSearchChange}
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

        {/* User Status Warning Dialog */}
        <UserStatusWarningDialog
          open={warningDialogOpen}
          onOpenChange={setWarningDialogOpen}
          onConfirm={handleStatusChangeConfirm}
          userName={selectedUser?.fullname || ""}
          currentStatus={selectedUser?.currentStatus || ""}
          newStatus={
            selectedUser?.currentStatus === "banned" ? "active" : "banned"
          }
          isLoading={isProcessingStatus}
        />
      </div>
    </PrivateRoute>
  );
}

export default SupportUserList;
