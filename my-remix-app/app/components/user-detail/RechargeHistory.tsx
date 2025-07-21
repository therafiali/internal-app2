import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DollarSign } from "lucide-react";
import { DynamicTable } from "../shared/DynamicTable";
import { useFetchPlayerRechargeRequests, type RechargeRequest } from "~/hooks/api/queries/useFetchRechargeRequests";
import { getRechargeType } from "~/lib/constants";
import { useEffect } from "react";

interface RechargeHistoryProps {
  playerId: string;
}

export default function RechargeHistory({ playerId }: RechargeHistoryProps) {
  const { data: rechargeRequests, isLoading, error, refetch } = useFetchPlayerRechargeRequests(playerId);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!playerId) return;

    const interval = setInterval(() => {
      refetch();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [playerId, refetch]);

  // Calculate total deposits
  const totalDeposits = rechargeRequests?.reduce((total, request) => {
    return total + (request.amount || 0);
  }, 0) || 0;

  // Define table columns
  const columns = [
    {
      accessorKey: "rechargeId",
      header: "Recharge ID",
      cell: ({ row }: { row: { original: RechargeRequest } }) => (
        <span className="font-mono text-sm">{row.original.recharge_id || "N/A"}</span>
      ),
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }: { row: { original: RechargeRequest } }) => (
        <span className="text-blue-400">{row.original.games?.game_name || "N/A"}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }: { row: { original: RechargeRequest } }) => (
        <span className="font-semibold text-green-400">
          ${row.original.amount || 0}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }: { row: { original: RechargeRequest } }) => (
        <span className="text-purple-400">{row.original.payment_methods?.payment_method || "N/A"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: RechargeRequest } }) => {
        const status = getRechargeType(row.original.process_status || "");
        const getStatusColor = (status: string) => {
          switch (status.toLowerCase()) {
            case "completed":
              return "text-green-400";
              case "pending":
                return "text-yellow-400";
            case "live":
              return "text-blue-400";
              default:
                return "text-gray-400";
              }
            };
            
            return (
              <span className={`${getStatusColor(status || "")} font-medium`}>
            <span className="text-purple-400 mr-5">{row.original.process_status || "N/A"}</span>
            {status || "Unknown"}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }: { row: { original: RechargeRequest } }) => {
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

  const pageCount = Math.ceil(rechargeRequests?.length || 0 / 10);

  // Transform data for table
  const tableData = rechargeRequests || [];

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5 text-purple-400" />
            Recharge History
            <span className="text-xs text-gray-400 ml-2">(Auto-refresh every 10s)</span>
          </CardTitle>
          <span className="text-blue-400 font-medium">Loading...</span>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            Loading recharge history...
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
            <DollarSign className="h-5 w-5 text-purple-400" />
            Recharge History
            <span className="text-xs text-gray-400 ml-2">(Auto-refresh every 10s)</span>
          </CardTitle>
          <span className="text-red-400 font-medium">Error loading data</span>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-400">
            Failed to load recharge history
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5 text-purple-400" />
          Recharge History
          <span className="text-xs text-gray-400 ml-2">(Auto-refresh every 10s)</span>
        </CardTitle>
        <span className="text-blue-400 font-medium">
          Total Deposits: ${totalDeposits}
        </span>
      </CardHeader>
      <CardContent>
        {tableData.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No recharge history found for this player
          </div>
        ) : (
          <DynamicTable 
          columns={columns} data={tableData} pagination={true} pageCount={pageCount} pageIndex={0} limit={10} /> 
        )}
      </CardContent>
    </Card>
  );
} 