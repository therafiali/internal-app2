import { useState } from "react";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
<<<<<<< Updated upstream
import {
  useFetchRechargeRequests,
  useFetchRechargeRequestsCount,
  RechargeRequest,
} from "../hooks/api/queries/useFetchRechargeRequests";
=======
import { useFetchRechargeRequests, useFetchRechargeRequestsCount, useFetchAllRechargeRequests, RechargeRequest } from "../hooks/api/queries/useFetchRechargeRequests";
>>>>>>> Stashed changes
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
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
<<<<<<< Updated upstream
  const [statusFilter, setStatusFilter] = useState<"pending" | "assigned">(
    "pending"
  );

  const { user } = useAuth();

  // Fetch data with pagination
  const { data, isLoading, isError, error, refetch } = useFetchRechargeRequests(
    statusFilter === "assigned"
      ? RechargeProcessStatus.FINANCE_CONFIRMED
      : RechargeProcessStatus.FINANCE,
    pageSize,
    pageIndex * pageSize
=======
  const [statusFilter, setStatusFilter] = useState<'pending' | 'assigned'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  const processStatus = statusFilter === 'assigned' ? RechargeProcessStatus.FINANCE_CONFIRMED : RechargeProcessStatus.FINANCE;
  
  // Fetch data - use all data when searching, paginated when not
  const { data: paginatedData, isLoading: isPaginatedLoading, isError: isPaginatedError, error: paginatedError, refetch: refetchPaginated } = useFetchRechargeRequests(
    processStatus,
    searchTerm ? undefined : pageSize, // No limit when searching
    searchTerm ? undefined : pageIndex * pageSize // No offset when searching
>>>>>>> Stashed changes
  );

  // Fetch all data for search
  const { data: allData, isLoading: isAllLoading, isError: isAllError, error: allError, refetch: refetchAll } = useFetchAllRechargeRequests(processStatus);

  // Fetch total count for pagination
<<<<<<< Updated upstream
  const { data: totalCount, isLoading: isCountLoading } =
    useFetchRechargeRequestsCount(
      statusFilter === "assigned"
        ? RechargeProcessStatus.FINANCE_CONFIRMED
        : RechargeProcessStatus.FINANCE
    );
=======
  const { data: totalCount, isLoading: isCountLoading } = useFetchRechargeRequestsCount(processStatus);

  // Use appropriate data source
  const data = searchTerm ? allData : paginatedData;
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;
  const error = searchTerm ? allError : paginatedError;
  const refetch = searchTerm ? refetchAll : refetchPaginated;
>>>>>>> Stashed changes

  // State for modal
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

<<<<<<< Updated upstream
  console.log(assignModalOpen, "assignModalOpen finance recharge");
  const pageCount = Math.ceil((totalCount || 0) / pageSize);
=======
  console.log(assignModalOpen, "assignModalOpen finance recharge")
  // Calculate page count - use filtered data length when searching
  const pageCount = searchTerm ? Math.ceil((data || []).length / pageSize) : Math.ceil((totalCount || 0) / pageSize);
>>>>>>> Stashed changes

  // Map fetched data to table format
  const tableData = (data || []).map((item: RechargeRequest) => ({
    pendingSince: item.created_at || "-",
    rechargeId: item.recharge_id || item.id || "-",
    user: item.players
      ? `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim()
      : "-",
    paymentMethod:
      item.payment_methods?.payment_method || item.payment_method || "-",
    amount: item.amount ? `$${item.amount}` : "-",
    actions: (
      <Button
        variant="default"
        onClick={() => {
          setSelectedRow(item);
          if (statusFilter === "assigned") {
            setAssignModalOpen(true);
          } else {
            setModalOpen(true);
          }
        }}
      >
        Assign
      </Button>
    ),
  }));

  console.log(tableData, "tableData finance recharge");

  if (isLoading || isCountLoading) {
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
      selectedRow.amount,
      selectedRow.target_id,
      user?.id
    );

    if (error) {
      console.error(error);
    } else {
      setAssignModalOpen(false);
      setSelectedRow(null);
      refetch();
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

      <DynamicTable
        columns={columns}
        data={tableData}
        pagination={true}
        pageCount={pageCount}
        pageIndex={pageIndex}
        pageCount={pageCount}
        limit={pageSize}
<<<<<<< Updated upstream
        onPageChange={setPageIndex}
      />
      {/* Pending Modal */}
      {statusFilter === "pending" && (
=======
        onPageChange={(newPageIndex) => {
          setPageIndex(newPageIndex);
          if (searchTerm) setPageIndex(0); // Reset to first page when searching
        }}
        onSearchChange={(search) => {
          setSearchTerm(search);
          setPageIndex(0); // Reset to first page when search changes
        }} />
            {/* Pending Modal */}
      {statusFilter === 'pending' && (
>>>>>>> Stashed changes
        <AssignDepositRequestDialog
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedRow(null);
          }}
          selectedRow={selectedRow}
          onSuccess={refetch}
        />
      )}

      {/* Assigned Modal */}
      <Dialog
        open={assignModalOpen}
        onOpenChange={(open) => {
          setAssignModalOpen(open);
          if (!open) setSelectedRow(null);
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
                      ? `${selectedRow.players.firstname || ""} ${
                          selectedRow.players.lastname || ""
                        }`.trim()
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
