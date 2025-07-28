import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import TeamTabsBar from "../components/shared/TeamTabsBar";
import { Button } from "../components/ui/button";
import { PageLoader } from "../components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { useState } from "react";
import { useFetchNewAccountRequests } from "../hooks/api/queries/useFetchNewAccountRequests";
import { useFetchTeams } from "../hooks/api/queries/useFetchTeams";
import { supabase } from "../hooks/use-auth";
import { NewAccountProcessStatus } from "../lib/constants";

import { useQueryClient } from "@tanstack/react-query";
import DynamicButtonGroup from "../components/shared/DynamicButtonGroup";
import { useFetchCounts } from "../hooks/api/queries/useFetchCounts";

export default function NewAccountPage() {
  type RowType = {
    id: string;
    initBy: string;
    player: string;
    team: string;
    platform: string;
    vipCode: string;
    status: string;
    createdAt: string;
    operation_newaccount_process_status?: string;
    operation_newaccount_process_by?: string | null;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [gameUsername, setGameUsername] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Fetch teams dynamically from database
  const { data: rawTeams = ["All Teams"] } = useFetchTeams();
  
  // Replace "All Teams" with "ALL" for consistency
  const teams = rawTeams.map(team => team === "All Teams" ? "ALL" : team);
  
  // Fetch counts for each status - using player_platfrom_usernames table
  const { data: pendingCountData } = useFetchCounts("player_platfrom_usernames", [NewAccountProcessStatus.PENDING]);
  const { data: completedCountData } = useFetchCounts("player_platfrom_usernames", [NewAccountProcessStatus.APPROVED]);

  const pendingCount = pendingCountData ? pendingCountData.length : 0;
  const completedCount = completedCountData ? completedCountData.length : 0;

  const statusOptions = [
    { label: `PENDING (${pendingCount})`, value: "pending" },
    { label: `COMPLETED (${completedCount})`, value: "completed" },
  ];
  
  // Fetch data based on selectedStatus
  const getProcessStatusForTab = () => {
    if (selectedStatus === "completed") return NewAccountProcessStatus.APPROVED; // "1"
    return NewAccountProcessStatus.PENDING; // "0" for pending
  };

  const processStatus = getProcessStatusForTab();

  // Fetch new account requests data
  const { data: allData, isLoading, isError, error, refetch } = useFetchNewAccountRequests();

  // Filter data based on status
  const filteredData = allData?.filter(item => item.process_status === processStatus) || [];
  
  // Filter by search term
  const searchFilteredData = searchTerm
    ? filteredData.filter(item =>
        item.players?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.games?.game_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredData;

  // Paginate data
  const pageSize = 10;
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = searchFilteredData.slice(startIndex, endIndex);
  
  // Use appropriate data source
  const data = searchTerm ? searchFilteredData : paginatedData;
  const isLoadingData = searchTerm ? false : isLoading;
  const isErrorData = searchTerm ? false : isError;
  const errorData = searchTerm ? null : error;
  
  // Function to refetch data after updates
  const refetchData = () => {
    refetch();
    queryClient.invalidateQueries({
      queryKey: ["new-account-requests"],
    });
  };

  // Calculate page count
  const pageCount = Math.ceil(searchFilteredData.length / pageSize);

  console.log("New Account Requests Data:", data);

  const columns = [
    { accessorKey: "initBy", header: "INIT BY" },
    { accessorKey: "player", header: "PLAYER" },
    { accessorKey: "team", header: "TEAM" },
    { accessorKey: "platform", header: "PLATFORM" },
    { accessorKey: "vipCode", header: "VIP CODE" },
    { accessorKey: "status", header: "STATUS" },
    { accessorKey: "createdAt", header: "CREATED AT" },
    {
      accessorKey: "actions",
      header: "ACTIONS",
      cell: ({ row }: { row: { original: RowType } }) => (
        <Button
          disabled={row.original.operation_newaccount_process_status === "in_process"}
          onClick={() => {
            setSelectedRow(row.original);
            setGameUsername("");
            setRemarks("");
            setOpen(true);
          }}
        >
          {row.original.operation_newaccount_process_status === "in_process"
            ? `In Process${row.original.operation_newaccount_process_by ? ` by '${row.original.player}'` : ""}`
            : "Process"}
        </Button>
      ),
    },
  ];

  // Map the fetched data to the table row format
  const tableData: RowType[] = (Array.isArray(data) ? data : []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => {
      return {
        id: String(item.id ?? "-"),
        initBy: "Agent", // Default value since we don't have init_by in new structure
        player: item.players?.fullname ?? "-",
        team: "ALL", // Default since we don't have team info in new structure
        platform: item.games?.game_name ?? "-",
        vipCode: "-", // Not available in new structure
        status: item.process_status === "0" ? "Pending" : item.process_status === "1" ? "Approved" : "Unknown",
        createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : "-",
        operation_newaccount_process_status: item.process_status,
        operation_newaccount_process_by: null, // Not available in new structure
      };
    }
  );

  // Filter table data by selected team
  const filteredTableData = selectedTeam === "ALL"
    ? tableData
    : tableData.filter((row) => row.team === selectedTeam);

  // Use search-filtered data when searching, team-filtered when not
  const finalTableData = searchTerm ? tableData : filteredTableData;

  async function handleProcessSubmit() {
    if (!selectedRow) return;
    setSaving(true);
    const { error } = await supabase
      .from("player_platfrom_usernames")
      .update({
        game_username: gameUsername,
        remarks: remarks,
        process_status: NewAccountProcessStatus.APPROVED,
      })
      .eq("id", selectedRow.id);
    setSaving(false);
    if (!error) {
      setOpen(false);
      setSelectedRow(null);
      setGameUsername("");
      setRemarks("");
      refetchData();
    } else {
      alert("Failed to update request: " + error.message);
    }
  }

  if (isLoadingData) {
    return <PageLoader />;
  }
  if (isErrorData) {
    return <div className="p-6 text-red-500">Error: {errorData?.message || 'Unknown error'}</div>;
  }

  // Render table and pagination controls
  return (
    <div className="p-6">
      <DynamicHeading title="New Account Requests" />
      {/* Team Tabs */}
      <TeamTabsBar 
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamChange={setSelectedTeam}
      />
      {/* Status Bar */}
      <DynamicButtonGroup
        options={statusOptions}
        active={selectedStatus}
        onChange={(status) => {
          setSelectedStatus(status);
          setPage(0); // Reset to first page when status changes
        }}
        className="mb-4"
      />
      <DynamicTable
        columns={columns}
        data={finalTableData}
        pagination={true}
        pageIndex={page}
        pageCount={pageCount}
        limit={10}
        onPageChange={(newPageIndex) => {
          setPage(newPageIndex);
          if (searchTerm) setPage(0);
        }}
        onSearchChange={(search) => {
          setSearchTerm(search);
          setPage(0);
        }}
      />
      {/* Process Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process New Account Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Game Username</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={gameUsername}
                onChange={e => setGameUsername(e.target.value)}
                placeholder="Enter game username"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Remarks (Password)</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Enter remarks or password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleProcessSubmit} disabled={saving || !gameUsername}>
              {saving ? "Saving..." : "Save & Approve"}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}






