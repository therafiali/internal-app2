import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

export const fetchRedeemPaidHistory = async (redeemId: string) => {
  const { data, error } = await supabase
    .from("recharge_requests")
    .select("target_id, amount, created_at")
    .in("process_status", ["2", "3", "4", "5", "6", "7", "8", "9"])
    .eq("target_id", redeemId);
  if (error) {
    throw error;
  }

  const { data: ctActivityLogs, error: ctActivityLogsError } = await supabase
    .from("ct_activity_logs")
    .select("tag_id, amount, created_at")
    .eq("target_id", redeemId);
  if (ctActivityLogsError) {
    throw ctActivityLogsError;
  }

  return {
    data,
    ctActivityLogs,
  };
};

export const useFetchRedeemPaidHistory = (redeemId: string) => {
  return useQuery({
    queryKey: ["redeem-paid-history", redeemId],
    queryFn: () => fetchRedeemPaidHistory(redeemId),
  });
};
