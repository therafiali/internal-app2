import { useFetchRedeemPaidHistory } from "~/hooks/api/queries/useFetchRedeemPaidHistory";
import { Dialog, DialogContent } from "../ui/dialog";
import { formatDateForDisplay } from "../../lib/utils";

interface RechargeRequest {
  target_id: string;
  amount: number;
  created_at: string;
}

interface CTActivityLog {
  tag_id: string;
  amount: number;
  created_at: string;
}

interface TimelineItem {
  id: string;
  type: "pt-pay" | "ct-pay";
  data: RechargeRequest | CTActivityLog;
  created_at: string;
}

interface RedeemHistoryPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  redeemId?: string;
}

export default function RedeemHistoryPreview({
  isOpen,
  onClose,
  redeemId,
}: RedeemHistoryPreviewProps) {
  const { data, isLoading, error } = useFetchRedeemPaidHistory(redeemId || "");

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 bg-gray-900 border-gray-700 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Redeem History</h2>
              <p className="text-sm text-gray-300">ID: {redeemId}</p>
            </div>
          </div>
          <div className="p-6 flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 bg-gray-900 border-gray-700 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Redeem History</h2>
              <p className="text-sm text-gray-300">ID: {redeemId}</p>
            </div>
          </div>
          <div className="p-6 flex items-center justify-center">
            <div className="text-red-400">Error loading data</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const rechargeRequests = data?.data || [];
  const ctActivityLogs = data?.ctActivityLogs || [];

  // Merge and sort all items by created_at
  const timelineItems: TimelineItem[] = [
    ...rechargeRequests.map((request, index) => ({
      id: `pt-${index}`,
      type: "pt-pay" as const,
      data: request,
      created_at: request.created_at,
    })),
    ...ctActivityLogs.map((log, index) => ({
      id: `ct-${index}`,
      type: "ct-pay" as const,
      data: log,
      created_at: log.created_at,
    })),
  ].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const renderTimelineItem = (item: TimelineItem) => {
    if (item.type === "pt-pay") {
      const request = item.data as RechargeRequest;
      return (
        <div className="relative flex">
          <div className="absolute left-6 top-8 w-5 h-5 bg-blue-500 rounded-full border-3 border-gray-600 -translate-x-1/2 z-10 shadow-lg"></div>
          <div className="ml-12 flex-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white text-lg">PT </h3>
                <span className="text-blue-400 text-sm font-medium">
                  Platform Transfer
                </span>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Target ID:</span>
                  <span className="text-white font-medium">
                    {request.target_id}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-300 text-sm">Amount:</span>
                  <span className="text-white font-semibold">
                    ${request.amount}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-300 text-sm">Created:</span>
                  <span className="text-white text-sm">
                    {formatDateForDisplay(request.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const log = item.data as CTActivityLog;
      return (
        <div className="relative flex">
          <div className="absolute left-6 top-8 w-5 h-5 bg-green-500 rounded-full border-3 border-gray-600 -translate-x-1/2 z-10 shadow-lg"></div>
          <div className="ml-12 flex-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white text-lg">CT </h3>
                <span className="text-green-400 text-sm font-medium">
                  Company Tag
                </span>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Tag ID:</span>
                  <span className="text-white font-medium">{log.tag_id}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-300 text-sm">Amount:</span>
                  <span className="text-white font-semibold">
                    ${log.amount}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-300 text-sm">Created:</span>
                  <span className="text-white text-sm">
                    {formatDateForDisplay(log.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 bg-gray-900 border-gray-700 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Redeem History</h2>
            <p className="text-sm text-gray-300">ID: {redeemId}</p>
          </div>
        </div>

        {/* Content with Timeline - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-gray-500 via-gray-600 to-gray-500"></div>

            {/* Timeline Items */}
            <div className="space-y-8">
              {timelineItems.length > 0 ? (
                timelineItems.map((item) => (
                  <div key={item.id}>{renderTimelineItem(item)}</div>
                ))
              ) : (
                <div className="relative flex">
                  <div className="absolute left-6 top-8 w-5 h-5 bg-gray-500 rounded-full border-3 border-gray-600 -translate-x-1/2 z-10 shadow-lg"></div>
                  <div className="ml-12 flex-1">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-sm">
                      <h3 className="font-semibold text-white mb-3 text-lg">
                        No History Found
                      </h3>
                      <p className="text-gray-300 text-sm">
                        No recharge requests or activity logs found for this
                        redeem ID.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
