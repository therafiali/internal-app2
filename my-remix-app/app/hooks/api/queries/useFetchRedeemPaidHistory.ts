import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

export const fetchRedeemPaidHistory = async (redeemId: string) => {
  const { data, error } = await supabase
    .from("recharge_requests")
    .select("target_id, amount")
    .eq("target_id", redeemId);
  if (error) {
    throw error;
  }

  const { data: ctActivityLogs, error: ctActivityLogsError } = await supabase
    .from("ct_activity_logs")
    .select("tag_id, amount")
    .eq("target_id", redeemId);
  if (ctActivityLogsError) {
    throw ctActivityLogsError;
  }

  console.log(data, "fetch data RedeemHistoryPreview");
  console.log(ctActivityLogs, "fetch data RedeemHistoryPreview");

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
