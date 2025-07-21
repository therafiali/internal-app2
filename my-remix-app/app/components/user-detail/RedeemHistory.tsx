import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Wallet } from "lucide-react";
import { DynamicTable } from "../shared/DynamicTable";
import { useFetchPlayerRedeemRequests, type RedeemRequest } from "~/hooks/api/queries/useFetchRedeemRequests";
import { getRedeemType } from "~/lib/constants";
import { useEffect } from "react";

interface RedeemHistoryProps {
  playerId: string;
}

export default function RedeemHistory({ playerId }: RedeemHistoryProps) {
  const { data: redeemRequests, isLoading, error, refetch } = useFetchPlayerRedeemRequests(playerId);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!playerId) return;

    const interval = setInterval(() => {
      refetch();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [playerId, refetch]);

  // Calculate total redeemed
  const totalRedeemed = redeemRequests?.reduce((total, request) => {
    return total + (request.total_amount || 0);
  }, 0) || 0;

  // Define table columns
  const columns = [
    {
      accessorKey: "redeemId",
      header: "Redeem ID",
      cell: ({ row }: { row: { original: RedeemRequest } }) => (
        <span className="font-mono text-sm">{row.original.redeem_id || "N/A"}</span>
      ),
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }: { row: { original: RedeemRequest } }) => (
        <span className="text-blue-400">{row.original.games?.game_name || "N/A"}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: ({ row }: { row: { original: RedeemRequest } }) => (
        <span className="font-semibold text-green-400">
          ${row.original.total_amount || 0}
        </span>
      ),
    },
    {
      accessorKey: "amountPaid",
      header: "Amount Paid",
      cell: ({ row }: { row: { original: RedeemRequest } }) => (
        <span className="font-semibold text-yellow-400">
          ${row.original.amount_paid || 0}
        </span>
      ),
    },
    {
      accessorKey: "amountAvailable",
      header: "Amount Remaining",
      cell: ({ row }: { row: { original: RedeemRequest } }) => (
        <span className="font-semibold text-purple-400">
         ${row.original.total_amount - (row.original.amount_paid || 0)}
        </span>
      ),
    },
    
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: RedeemRequest } }) => {
        const status = getRedeemType(row.original.process_status || "");
        const getStatusColor = (status: string) => {
          switch (status.toLowerCase()) {
            case "completed":
              return "text-green-400";
            case "pending":
            case "under verification":
            case "under finance review":
              return "text-yellow-400";
            case "partially paid":
              return "text-blue-400";
            case "cancelled":
            case "operation failed":
            case "verification failed":
            case "finance failed":
            case "operation rejected":
              return "text-red-400";
            default:
              return "text-gray-400";
          }
        };
        return (
          <div>
            <span className="text-purple-400 mr-5">{row.original.process_status || "N/A"}</span>
            <span className={`${getStatusColor(status || "")} font-medium`}>
              {status || "Unknown"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }: { row: { original: RedeemRequest } }) => {
        const date = row.original.created_at ? new Date(row.original.created_at) : null;
        return date ? (
          <div className="text-sm">
            <div>{date.toLocaleDateString()}</div>
            <div className="text-gray-400">{date.toLocaleTimeString()}</div>
          </div>
        ) : (
          "N/A"
        );
      },
    },
  ];

  // Transform data for table
  const tableData = redeemRequests || [];

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="h-5 w-5 text-purple-400" />
            Redeem History
            <span className="text-xs text-gray-400 ml-2">(Auto-refresh every 10s)</span>
          </CardTitle>
          <span className="text-blue-400 font-medium">Loading...</span>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            Loading redeem history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="h-5 w-5 text-purple-400" />
            Redeem History
            <span className="text-xs text-gray-400 ml-2">(Auto-refresh every 10s)</span>
          </CardTitle>
          <span className="text-red-400 font-medium">Error loading data</span>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-400">
            Failed to load redeem history
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <Wallet className="h-5 w-5 text-purple-400" />
          Redeem History
          <span className="text-xs text-gray-400 ml-2">(Auto-refresh every 10s)</span>
        </CardTitle>
        <span className="text-blue-400 font-medium">
          Total Redeemed: ${totalRedeemed.toFixed(2)}
        </span>
      </CardHeader>
      <CardContent>
        {tableData.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No redeem history found for this player
          </div>
        ) : (
          <DynamicTable columns={columns} data={tableData} />
        )}
      </CardContent>
    </Card>
  );
} 