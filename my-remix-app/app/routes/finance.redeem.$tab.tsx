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
import { useFetchRedeemRequests, useFetchAllRedeemRequests } from "../hooks/api/queries/useFetchRedeemRequests";
import { supabase } from "../hooks/use-auth";
import { RedeemProcessStatus } from "../lib/constants";
import { useQueryClient } from '@tanstack/react-query';
import { formatPendingSince } from "../lib/utils";

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
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // Fetch data - use all data when searching, paginated when not
  const { data: paginatedData, isLoading: isPaginatedLoading, isError: isPaginatedError, error: paginatedError } = useFetchRedeemRequests(
    RedeemProcessStatus.FINANCE,
    searchTerm ? undefined : limit,
    searchTerm ? undefined : pageIndex * limit
  );

  // Fetch all data for search
  const { data: allData, isLoading: isAllLoading, isError: isAllError, error: allError } = useFetchAllRedeemRequests(RedeemProcessStatus.FINANCE);

  // Use appropriate data source
  const data = searchTerm ? allData : paginatedData;
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;
  const error = searchTerm ? allError : paginatedError;

  // Calculate page count - use filtered data length when searching
  const pageCount = searchTerm ? Math.ceil((data || []).length / limit) : Math.ceil((data || []).length / limit);

  console.log('Finance Redeem Requests Data:', data);

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
    id: item.redeem_id || '-',
    pendingSince: item.created_at || '-',
    teamCode: item.teams?.team_code ? `ENT-${String(item.teams.team_code).replace(/\D+/g, "")}` : '-',
    redeemId: item.redeem_id || '-',
    platform: item.games?.game_name || '-',
    totalAmount: item.total_amount ? `$${item.total_amount}` : "-",
    paidAmount: item.amount_paid ? `$${item.amount_paid}` : '-',
    holdAmount: item.amount_hold ? `$${item.amount_hold}` : '-',
    remainingAmount: item.remaining_amount ? `$${item.remaining_amount}` : '-',
    availableToHold: item.amount_available ? `$${item.amount_available}` : '-',
    paymentMethod: item.payment_methods?.payment_method || '-',
    amount: item.amount || 0,
    
    user: item.players
      ? `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim() || '-'
      : '-',
    initBy: '-', // No direct player_id in RedeemRequest, so fallback to '-'
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
      queryClient.invalidateQueries({ queryKey: ['redeem_requests', RedeemProcessStatus.FINANCE] });
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (isError) {
    return <div className="p-6 text-red-500">Error: {error?.message || 'Unknown error'}</div>;
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Finance Redeem Request Details
            </DialogTitle>
            <div className="w-16 h-1 bg-gray-600 mx-auto rounded-full mt-2"></div>
          </DialogHeader>
          
          {selectedRow && (
            <div className="space-y-4 py-4">
              {/* User Info Card */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-300 text-sm font-bold">👤</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">USER INFORMATION</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Name</p>
                    <p className="text-white font-medium">
                      {selectedRow.user || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Team</p>
                    <p className="text-white font-medium">
                      {selectedRow.teamCode || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Details Card */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-300 text-sm font-bold">💳</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">REQUEST DETAILS</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Redeem ID</p>
                    <p className="text-white font-medium font-mono bg-gray-800 px-2 py-1 rounded text-sm">
                      {selectedRow.redeemId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Platform</p>
                    <p className="text-white font-medium">{selectedRow.platform || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Financial Info Card */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-300 text-sm font-bold">💰</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">FINANCIAL INFO</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-green-400">
                      {selectedRow.totalAmount || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Paid Amount</p>
                    <p className="text-white font-medium">
                      {selectedRow.paidAmount || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Hold Amount</p>
                    <p className="text-white font-medium">
                      {selectedRow.holdAmount || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Payment Method</p>
                    <p className="text-white font-medium">
                      {selectedRow.paymentMethod || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Info Card */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-300 text-sm font-bold">⏰</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">TRANSACTION INFO</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Available to Hold</p>
                    <p className="text-white font-medium">
                      {selectedRow.availableToHold || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Pending Since</p>
                    <p className="text-white font-medium text-sm">
                      {selectedRow.pendingSince
                        ? new Date(selectedRow.pendingSince).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="destructive" 
              className="flex-1 transition-all duration-200 font-semibold"
            >
              <span className="mr-2">❌</span>
              Reject
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                if (selectedRow) {
                  await updateRedeemStatus(selectedRow.id);
                }
              }}
              className="flex-1 transition-all duration-200 font-semibold"
            >
              <span className="mr-2">✅</span>
              Process Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
