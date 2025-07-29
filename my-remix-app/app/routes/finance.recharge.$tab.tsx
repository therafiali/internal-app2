import { useState, useEffect } from "react";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { SearchBar } from "../components/shared/SearchBar";
import { useFetchRechargeRequests, useFetchAllRechargeRequests, RechargeRequest } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "../lib/constants";
import { Button } from "../components/ui/button";
import AssignDepositRequestDialog from "../components/AssignDepositRequestDialog";
import { formatPendingSince } from "../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogHeader,
} from "../components/ui/dialog";
import { supabase, useAuth } from "../hooks/use-auth";
import { financeConfirmRecharge } from "~/services/assign-company-tags.service";

const columns = [
  {
    accessorKey: "pendingSince",
    header: "PENDING SINCE",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cell: ({ row }: { row: { original: any } }) => {
      const { relative, formattedDate, formattedTime } = formatPendingSince(
        row.original.pendingSince
      );
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{relative}</div>
          <div>{formattedDate}</div>
          <div>{formattedTime}</div>
        </div>
      );
    },
  },
  { accessorKey: "rechargeId", header: "RECHARGE ID" },
  { accessorKey: "user", header: "USER" },
  { accessorKey: "paymentMethod", header: "PAYMENT METHOD" },
  { accessorKey: "amount", header: "AMOUNT" },
  { accessorKey: "actions", header: "ACTIONS" },
];

export default function RechargeQueuePage() {
  const { user } = useAuth();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'assigned'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Reset page to 0 when status changes
  useEffect(() => {
    setPageIndex(0);
  }, [statusFilter]);
  
  const processStatus = statusFilter === 'assigned' ? RechargeProcessStatus.FINANCE_CONFIRMED : RechargeProcessStatus.FINANCE;
  
  // Fetch data - use all data when searching, paginated when not
  const { data: paginatedResult, isLoading: isPaginatedLoading, isError: isPaginatedError, error: paginatedError, refetch: refetchPaginated } = useFetchRechargeRequests(
    processStatus,
    searchTerm ? undefined : pageSize,
    searchTerm ? undefined : pageIndex * pageSize
  );

  // Fetch all data for search
  const { data: allDataResult, isLoading: isAllLoading, isError: isAllError, error: allError, refetch: refetchAll } = useFetchAllRechargeRequests(processStatus);
  const allData = allDataResult?.data || [];

  // Use appropriate data source
  const rawData = searchTerm ? allData : (paginatedResult?.data || []);
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;
  const error = searchTerm ? allError : paginatedError;

  // Filter data by search term and team
  const searchFilteredData = searchTerm
    ? (rawData || []).filter((row) => {
        const searchLower = searchTerm.toLowerCase().trim();
        return (
          (row.recharge_id || "").toLowerCase().includes(searchLower) ||
          (row.players?.fullname || "").toLowerCase().includes(searchLower)
        );
      })
    : (rawData || []);

  // Filter data by selected team (finance doesn't have team filtering, so just use searchFilteredData)
  const data = searchFilteredData;

  // Calculate page count - use filtered data length when searching
  const pageCount = searchTerm ? Math.ceil((data || []).length / pageSize) : Math.ceil((paginatedResult?.total || 0) / pageSize);

  // State for modal
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  console.log(assignModalOpen, "assignModalOpen finance recharge")

  // Function to reset process status to 'idle' if modal is closed without processing
  async function resetProcessStatus(id: string) {
    await supabase
      .from("recharge_requests")
      .update({
        finance_recharge_process_status: "idle",
        finance_recharge_process_by: null,
        finance_recharge_process_at: null,
      })
      .eq("id", id);
    refetchPaginated();
    refetchAll();
  }

  // Map current page data to table format  
  const tableData = (data || []).map((item: RechargeRequest) => ({
    pendingSince: item.created_at || "-",
    rechargeId: item.recharge_id || item.id || "-",
    user: item.players
      ? `${item.players.fullname || ""}`.trim()
      : "-",
    paymentMethod:
      item.payment_methods?.payment_method || item.payment_method || "-",
    amount: item.amount ? `$${item.amount}` : "-",
    actions: (
      <Button
        disabled={
          item.finance_recharge_process_status === "in_process"
        }
        variant="default"
        onClick={async () => {
          // fetch the row and check if it's in_process and show the alert
          const { data: rowData } = await supabase
            .from("recharge_requests")
            .select(
              "finance_recharge_process_status, finance_recharge_process_by, users:finance_recharge_process_by (name, employee_code)"
            )
            .eq("id", item.id);
          console.log(rowData, "rowData");
          if (
            rowData &&
            rowData[0].finance_recharge_process_status === "in_process"
          ) {
            const userName = rowData[0].users?.[0]?.name || "Unknown User";
            window.alert(
              rowData[0].finance_recharge_process_status +
                " already in process" +
                " by " + userName
            );
            refetchPaginated();
            refetchAll();
            return;
          }

          // update the finance_recharge_process_by to the current_user id from userAuth
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const currentUserId = userData.user.id;
            // update the finance_recharge_process_by to the current_user id from userAuth
            await supabase
              .from("recharge_requests")
              .update({
                finance_recharge_process_status: "in_process",
                finance_recharge_process_by: currentUserId,
                finance_recharge_process_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            setSelectedRow(item);
            refetchPaginated();
            refetchAll();
            if (statusFilter === "assigned") {
              setAssignModalOpen(true);
            } else {
              setModalOpen(true);
            }
          }
        }}
      >
        {item.finance_recharge_process_status === "in_process"
          ? `In Process${
              item.finance_recharge_process_by
                ? ` by '${item.finance_users?.[0]?.name || "Unknown"}'`
                : ""
            }`
          : "Assign"}
      </Button>
    ),
  }));

  console.log(tableData, "tableData finance recharge");

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-500">Error: {error?.message || 'Unknown error'}</div>;
  }

  const handleConfirm = async () => {
    if (!selectedRow?.id) return;

    const { error } = await supabase
      .from("recharge_requests")
      .update({
        process_status: RechargeProcessStatus.OPERATION,
      })
      .eq("id", selectedRow.id)
      .select()
      .single();

    await financeConfirmRecharge(
      selectedRow.id,
      selectedRow.amount || 0,
      selectedRow.payment_methods?.id || "",
      user?.id
    );

    if (error) {
      console.error(error);
    } else {
      setAssignModalOpen(false);
      setSelectedRow(null);
      refetchPaginated();
      refetchAll();
    }
  };

  const handleReject = () => {
    setAssignModalOpen(false);
    setSelectedRow(null);
  };

  return (
    <div className="p-8">
      <DynamicHeading title="Recharge Queue" />

      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          className={`px-6 ${
            statusFilter === "pending" ? "bg-blue-500" : "bg-gray-500"
          } hover:bg-blue-500`}
          onClick={() => setStatusFilter("pending")}
        >
          Pending
        </Button>
        <Button
          className={`px-6 ${
            statusFilter === "assigned" ? "bg-blue-500" : "bg-gray-500"
          } hover:bg-blue-500`}
          onClick={() => setStatusFilter("assigned")}
        >
          Assigned
        </Button>
      </div>

      <SearchBar
        placeholder="Search by recharge ID or user name..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <DynamicTable
        columns={columns}
        data={tableData}
        pagination={true}
        pageCount={pageCount}
        pageIndex={pageIndex}
        limit={pageSize}
        onPageChange={(newPageIndex) => {
          setPageIndex(newPageIndex);
        }}
        onSearchChange={(search) => {
          setSearchTerm(search);
          setPageIndex(0); // Reset to first page when search changes
        }} />
            {/* Pending Modal */}
      {statusFilter === 'pending' && (
        <AssignDepositRequestDialog
          open={modalOpen}
          onOpenChange={async (open) => {
            if (!open && selectedRow) {
              await resetProcessStatus(selectedRow.id);
              setSelectedRow(null);
            }
            setModalOpen(open);
          }}
          selectedRow={selectedRow}
          onSuccess={() => {
            refetchPaginated();
            refetchAll();
          }}
        />
      )}

      {/* Assigned Modal */}
      <Dialog
        open={assignModalOpen}
        onOpenChange={async (open) => {
          if (!open && selectedRow) {
            await resetProcessStatus(selectedRow.id);
            setSelectedRow(null);
          }
          setAssignModalOpen(open);
        }}
      >
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Recharge Details</DialogTitle>
            <DialogDescription>
              {selectedRow ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <b>Team:</b> {selectedRow.teams?.team_code || "-"}
                  </div>
                  <div>
                    <b>Init By:</b> Agent
                  </div>
                  <div>
                    <b>Depositor:</b>{" "}
                    {selectedRow.players
                      ? `${selectedRow.players.firstname || ""} ${
                          selectedRow.players.lastname || ""
                        }`.trim()
                      : "-"}
                  </div>
                  <div>
                    <b>Recharge ID:</b> {selectedRow.recharge_id || "-"}
                  </div>
                  <div>
                    <b>Platform:</b> {selectedRow.games?.game_name || "-"}
                  </div>
                  <div>
                    <b>User:</b>{" "}
                    {selectedRow.players
                      ? `${selectedRow.players.fullname || ""}`.trim()
                      : "-"}
                  </div>
                  <div>
                    <b>Payment Method:</b>{" "}
                    {selectedRow.payment_methods?.payment_method || "-"}
                  </div>
                  <div>
                    <b>Amount:</b>{" "}
                    {selectedRow.amount ? `$${selectedRow.amount}` : "-"}
                  </div>
                  <div>
                    <b>Pending Since:</b>{" "}
                    {selectedRow.created_at
                      ? new Date(selectedRow.created_at).toLocaleString()
                      : "-"}
                  </div>
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
            <Button
              variant="default"
              onClick={handleConfirm}
              disabled={!selectedRow}
            >
              Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
