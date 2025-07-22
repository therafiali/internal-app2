import { useState } from "react";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { useFetchAllRechargeRequests, RechargeRequest } from "../hooks/api/queries/useFetchRechargeRequests";
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
  const [statusFilter, setStatusFilter] = useState<'pending' | 'assigned'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  const processStatus = statusFilter === 'assigned' ? RechargeProcessStatus.FINANCE_CONFIRMED : RechargeProcessStatus.FINANCE;
  
  // Always fetch all data for client-side filtering (like userlist)
  const { data: allData, isLoading, isError, error, refetch } = useFetchAllRechargeRequests(processStatus);

  // Filter data by search term (like userlist approach)
  const filteredData = searchTerm
    ? (allData || []).filter((row) =>
        Object.values({
          rechargeId: row.recharge_id || row.id || "",
          user: row.players ? `${row.players.firstname || ""} ${row.players.lastname || ""}`.trim() : "",
          paymentMethod: row.payment_methods?.payment_method || row.payment_method || "",
          amount: row.amount ? `$${row.amount}` : ""
        }).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : (allData || []);

  // Calculate pagination for filtered data
  const totalCount = filteredData.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  
  // Get current page data from filtered results
  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = filteredData.slice(startIndex, endIndex);

  // State for modal
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  console.log(assignModalOpen, "assignModalOpen finance recharge")

  // Map current page data to table format  
  const tableData = currentPageData.map((item: RechargeRequest) => ({
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
