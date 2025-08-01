import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { SearchBar } from "../components/shared/SearchBar";
import { Button } from "../components/ui/button";
import { useEffect, useState } from "react";
import {
  useFetchRedeemRequestsMultiple,
  useFetchAllRedeemRequests,
} from "../hooks/api/queries/useFetchRedeemRequests";
import { RedeemProcessStatus } from "../lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { formatPendingSince } from "../lib/utils";
import RedeemProcessModal from "../components/RedeemProcessModal";
import { useProcessLock } from "../hooks/useProcessLock";
import { useAutoReopenModal } from "../hooks/useAutoReopenModal";
import { PauseProcessButton } from "../components/shared/PauseProcessButton";
import { useAuth, supabase } from "../hooks/use-auth";

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
    finance_redeem_process_status?: string;
    finance_redeem_process_by?: string;
    finance_users?: Array<{ name: string; employee_code: string }>;
    process_status?: string;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role;

  console.log("selectedRow from finance redeem page", selectedRow);

  // Add process lock hook for the selected row
  const { lockRequest, unlockRequest } = useProcessLock(
    selectedRow?.id || "",
    "finance"
  );

  // Reset page to 0 when status changes (for future tab functionality)
  useEffect(() => {
    setPageIndex(0);
  }, []);

  // handle locking and unlocking states through the user-action
  useEffect(() => {
    const tryLock = async () => {
      if (selectedRow && open === false) {
        console.log("Finance Redeem Modal Data:", selectedRow);
        const locked = await lockRequest(selectedRow.id);
        if (locked) {
          setOpen(true);
        } else {
          setSelectedRow(null);
          window.alert(
            "This request is already being processed by someone else."
          );
          refetch();
        }
      }
    };
    tryLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRow]);

  // Fetch data - use all data when searching, paginated when not
  const {
    data: multipleData,
    isLoading: isPaginatedLoading,
    isError: isPaginatedError,
    error: paginatedError,
    refetch: refetchPaginated,
  } = useFetchRedeemRequestsMultiple([
    RedeemProcessStatus.FINANCE,
    RedeemProcessStatus.COMPLETED,
    RedeemProcessStatus.FINANCEPARTIALLYPAID,
    RedeemProcessStatus.FINANCEPAUSED,
  ]);

  // Fetch all data for search
  const {
    data: allDataResult,
    isLoading: isAllLoading,
    isError: isAllError,
    error: allError,
    refetch: refetchAll,
  } = useFetchAllRedeemRequests(RedeemProcessStatus.FINANCE);
  const allData = allDataResult?.data || [];

  // Use appropriate data source
  const rawData = searchTerm ? allData : multipleData || [];
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;
  const error = searchTerm ? allError : paginatedError;
  const refetch = searchTerm ? refetchAll : refetchPaginated;

  // Filter data by search term
  const data = searchTerm
    ? rawData.filter((item: any) => {
        const searchLower = searchTerm.toLowerCase().trim();
        const userName = item.players
          ? `${item.players.firstname || ""} ${
              item.players.lastname || ""
            }`.trim()
          : "";
        return (
          userName.toLowerCase().includes(searchLower) ||
          (item.redeem_id || "").toLowerCase().includes(searchLower) ||
          (item.teams?.team_code || "").toLowerCase().includes(searchLower)
        );
      })
    : rawData;

  // Calculate page count - use filtered data length when searching
  const pageCount = searchTerm
    ? Math.ceil((data || []).length / limit)
    : Math.ceil(
        (Array.isArray(multipleData) ? multipleData.length : 0) / limit
      );

  console.log("Finance Redeem Requests Data:", data);

  // Use auto-reopen modal hook
  useAutoReopenModal({
    tableName: "redeem_requests",
    processByColumn: "finance_redeem_process_by",
    processStatusColumn: "finance_redeem_process_status",
    data,
    open,
    setSelectedRow,
    setOpen,
  });

  // Check every 2 seconds if modal should close
  useEffect(() => {
    if (open && selectedRow) {
      const interval = setInterval(async () => {
        const { data } = await supabase
          .from("redeem_requests")
          .select("finance_redeem_process_status")
          .eq("id", selectedRow.id)
          .single();
        
        if (data?.finance_redeem_process_status !== "in_process") {
          setOpen(false);
          setSelectedRow(null);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [open, selectedRow]);

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
        <div className="flex gap-2">
          <Button
            disabled={
              row.original.finance_redeem_process_status === "in_process"
            }
            variant="default"
            onClick={() => {
              setSelectedRow(row.original);
            }}
          >
            {row.original.finance_redeem_process_status === "in_process"
              ? `In Process${
                  row.original.finance_redeem_process_by
                    ? ` by '${row.original.finance_users?.[0]?.name || "Unknown"}'`
                    : ""
                }`
              : "Process"}
          </Button>
          <PauseProcessButton
            requestId={row.original.id}
            status={row.original.finance_redeem_process_status || "idle"}
            department="finance"
            requestType="redeem"
            userRole={userRole}
            onPaused={() => {
              queryClient.invalidateQueries({
                queryKey: ["redeem_requests", RedeemProcessStatus.FINANCE],
              });
            }}
          />
        </div>
      ),
    },
  ];

  // Map the fetched data to the table row format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData: RowType[] = Array.isArray(data)
    ? data.map((item: any) => ({
        id: item.id || "-",
        pendingSince: item.created_at || "-",
        teamCode: item.teams?.team_code
          ? `ENT-${String(item.teams.team_code).replace(/\D+/g, "")}`
          : "-",
        redeemId: item.redeem_id || "-",
        platform: item.games?.game_name || "-",
        totalAmount: item.total_amount ? `$${item.total_amount}` : "0",
        paidAmount: item.amount_paid ? `$${item.amount_paid}` : "0",
        holdAmount: item.amount_hold ? `$${item.amount_hold}` : "0",
        remainingAmount:
          item.total_amount - item.amount_paid
            ? `$${item.total_amount - item.amount_paid}`
            : "0",
        availableToHold: item.amount_available
          ? `$${item.amount_available}`
          : "0",
        paymentMethod: item.payment_methods?.payment_method || "-",
        amount: item.amount || 0,
        player_id: item.player_id || "-",
        user: item.players
          ? `${item.players.fullname || ""}`.trim() || "-"
          : "-",
        initBy: "-", // No direct player_id in RedeemRequest, so fallback to '-'
        finance_redeem_process_status:
          item.finance_redeem_process_status || "idle",
        finance_redeem_process_by: item.finance_redeem_process_by,
        finance_users: item.finance_users,
        process_status: item.process_status,
      }))
    : [];

  // Filter tableData based on activeFilter
  const filteredTableData = tableData.filter((item) => {
    switch (activeFilter) {
      case "queued":
        return item.process_status == "2";
      case "paused":
        return item.process_status == "12";
      case "partiallypaid":
        return item.process_status == "11";
      default:
        return true; // "all" - show all data
    }
  });

  // Calculate counts for each status
  const queuedCount = tableData.filter(item => item.process_status == "2").length;
  const pausedCount = tableData.filter(item => item.process_status == "12").length;
  const partiallyPaidCount = tableData.filter(item => item.process_status == "11").length;
  const allCount = tableData.length;

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
      <SearchBar
        placeholder="Search by user, redeem ID, or team..."
        value={searchTerm}
        onChange={setSearchTerm}
      />
      
      {/* Toggle Buttons */}
      <div className="flex gap-2 mt-4 mb-4">
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          onClick={() => setActiveFilter("all")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          ALL REQUESTS ({allCount})
        </Button>
        <Button
          variant={activeFilter === "queued" ? "default" : "outline"}
          onClick={() => setActiveFilter("queued")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          QUEUED ({queuedCount})
        </Button>
        <Button
          variant={activeFilter === "paused" ? "default" : "outline"}
          onClick={() => setActiveFilter("paused")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          PAUSED ({pausedCount})
        </Button>
        <Button
          variant={activeFilter === "partiallypaid" ? "default" : "outline"}
          onClick={() => setActiveFilter("partiallypaid")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          PARTIALLY PAID ({partiallyPaidCount})
        </Button>
      </div>
      
      <div className="mt-6">
        <DynamicTable
          columns={columns}
          data={filteredTableData}
          pagination={true}
          pageIndex={pageIndex}
          pageCount={pageCount}
          limit={limit}
          onPageChange={(newPageIndex) => {
            setPageIndex(newPageIndex);
            if (searchTerm) setPageIndex(0);
          }}
          onSearchChange={setSearchTerm}
        />
      </div>
      {/* Use RedeemProcessModal instead of Dialog for processing */}
      <RedeemProcessModal
        open={open}
        onOpenChange={async (isOpen) => {
          if (!isOpen && selectedRow) {
            await unlockRequest();
            setSelectedRow(null);
          }
          
          // Add 2-second check to verify if request is still in_process
          if (isOpen && selectedRow) {
            setTimeout(async () => {
              const { data: currentStatus } = await supabase
                .from("redeem_requests")
                .select("finance_redeem_process_status")
                .eq("id", selectedRow.id)
                .single();
              
              if (currentStatus?.finance_redeem_process_status !== "in_process") {
                setOpen(false);
                setSelectedRow(null);
              }
            }, 2000);
          }
          
          setOpen(isOpen);
        }}
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
