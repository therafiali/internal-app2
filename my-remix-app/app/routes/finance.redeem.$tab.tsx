import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { useState } from "react";
import {
  useFetchRedeemRequests,
  useFetchAllRedeemRequests,
} from "../hooks/api/queries/useFetchRedeemRequests";
import { supabase } from "../hooks/use-auth";
import { RedeemProcessStatus } from "../lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { formatPendingSince } from "../lib/utils";
import RedeemProcessModal from "../components/RedeemProcessModal";

export default function FinanceRedeemPage() {
  type RowType = {
    id: string;
    pendingSince: string;
    teamCode: string;
    redeemId: string;
    platform: string;
    user: string;
    initBy: string;
    totalAmount: string;
    paidAmount: string;
    holdAmount: string;
    remainingAmount: string;
    availableToHold: string;
    paymentMethod: string;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // Fetch data - use all data when searching, paginated when not
  const {
    data: paginatedData,
    isLoading: isPaginatedLoading,
    isError: isPaginatedError,
    error: paginatedError,
  } = useFetchRedeemRequests(
    RedeemProcessStatus.FINANCE,
    searchTerm ? undefined : limit,
    searchTerm ? undefined : pageIndex * limit
  );

  // Fetch all data for search
  const {
    data: allData,
    isLoading: isAllLoading,
    isError: isAllError,
    error: allError,
  } = useFetchAllRedeemRequests(RedeemProcessStatus.FINANCE);

  // Use appropriate data source
  const data = searchTerm ? allData : paginatedData;
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;
  const error = searchTerm ? allError : paginatedError;

  // Calculate page count - use filtered data length when searching
  const pageCount = searchTerm
    ? Math.ceil((data || []).length / limit)
    : Math.ceil((data || []).length / limit);

  console.log("Finance Redeem Requests Data:", data);

  const columns = [
    // { accessorKey: "processedBy", header: "PROCESSED BY" },
    // { accessorKey: "verifiedBy", header: "VERIFIED BY" },
    {
      accessorKey: "pendingSince",
      header: "PENDING SINCE",
      cell: ({ row }: { row: { original: RowType } }) => {
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
    { accessorKey: "redeemId", header: "REDEEM ID" },
    { accessorKey: "user", header: "USER" },
    { accessorKey: "totalAmount", header: "TOTAL AMOUNT" },
    { accessorKey: "paidAmount", header: "PAID AMOUNT" },
    { accessorKey: "holdAmount", header: "HOLD AMOUNT" },
    { accessorKey: "remainingAmount", header: "REMAINING AMOUNT" },
    { accessorKey: "availableToHold", header: "AVAILABLE TO HOLD" },
    { accessorKey: "paymentMethod", header: "PAYMENT METHOD" },
    {
      accessorKey: "actions",
      header: "ACTIONS",
      cell: ({ row }: { row: { original: RowType } }) => (
        <Button
          onClick={() => {
            console.log("row.original", row.original);
            setSelectedRow(row.original);
            setOpen(true);
          }}
        >
          Process
        </Button>
      ),
    },
  ];

  // Map the fetched data to the table row format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData: RowType[] = (data || []).map((item: any) => ({
    id: item.redeem_id || "-",
    pendingSince: item.created_at || "-",
    teamCode: item.teams?.team_code
      ? `ENT-${String(item.teams.team_code).replace(/\D+/g, "")}`
      : "-",
    redeemId: item.redeem_id || "-",
    platform: item.games?.game_name || "-",
    totalAmount: item.total_amount ? `$${item.total_amount}` : "-",
    paidAmount: item.amount_paid ? `$${item.amount_paid}` : "-",
    holdAmount: item.amount_hold ? `$${item.amount_hold}` : "-",
    remainingAmount: item.remaining_amount ? `$${item.remaining_amount}` : "-",
    availableToHold: item.amount_available ? `$${item.amount_available}` : "-",
    paymentMethod: item.payment_methods?.payment_method || "-",
    amount: item.amount || 0,
    player_id: item.player_id || "-",
    user: item.players ? `${item.players.fullname || ""}`.trim() || "-" : "-",
    initBy: "-", // No direct player_id in RedeemRequest, so fallback to '-'
  }));

  // Function to update status from 'finance' to 'completed'
  async function updateRedeemStatus(id: string) {
    const { error: updateError } = await supabase
      .from("redeem_requests")
      .update({ process_status: RedeemProcessStatus.COMPLETED })
      .eq("id", id);
    if (!updateError) {
      setOpen(false);
      // Invalidate the query to refetch data and update the UI
      queryClient.invalidateQueries({
        queryKey: ["redeem_requests", RedeemProcessStatus.FINANCE],
      });
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (isError) {
    return (
      <div className="p-6 text-red-500">
        Error: {error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="p-6">
      <DynamicHeading title="Finance Redeem Request" />
      <div className="mt-6">
        <DynamicTable
          columns={columns}
          data={tableData}
          pagination={true}
          pageIndex={pageIndex}
          pageCount={pageCount}
          limit={limit}
          onPageChange={(newPageIndex) => {
            setPageIndex(newPageIndex);
            if (searchTerm) setPageIndex(0);
          }}
          onSearchChange={(search) => {
            setSearchTerm(search);
            setPageIndex(0);
          }}
        />
      </div>
      {/* Use RedeemProcessModal instead of Dialog for processing */}
      <RedeemProcessModal
        open={open}
        onOpenChange={setOpen}
        selectedRow={selectedRow}
        onSuccess={() => {
          // Optionally refresh data after processing
          queryClient.invalidateQueries({
            queryKey: ["redeem_requests", RedeemProcessStatus.FINANCE],
          });
        }}
      />
    </div>
  );
}
