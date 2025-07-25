import { useState } from "react";
import { supabase } from "./use-auth";
import { toast } from "sonner";

export function useProcessLock(
  requestId: string, 
  department: "operation" | "verification" | "finance",
  requestType: "redeem" | "recharge" = "redeem"
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic column names (based on the supabase-schema (column-name))
  const statusCol = requestType === "recharge" 
    ? `${department}_recharge_process_status`
    : `${department}_redeem_process_status`;
  const byCol = requestType === "recharge"
    ? `${department}_recharge_process_by`
    : `${department}_redeem_process_by`;
  const atCol = requestType === "recharge"
    ? `${department}_recharge_process_at`
    : `${department}_redeem_process_at`;

  const tableName = requestType === "recharge" ? "recharge_requests" : "redeem_requests";

  async function lockRequest(idOverride?: string) {
    setLoading(true);
    const idToUse = idOverride || requestId;
    // Try to atomically set to in_process only if currently idle
    const { data, error } = await supabase
      .from(tableName)
      .update({
        [statusCol]: "in_process",
        [byCol]: null, // Optionally set to user id if available
        [atCol]: new Date().toISOString(),
      })
      .eq("id", idToUse)
      .eq(statusCol, "idle")
      .select(); 

    setLoading(false);

    if (error) {
      toast.error("Request not found");
      return false;
    }
    if (data && data.length === 1) {
      setIsProcessing(true);
      return true; // You got the lock!   
    } else {
      toast.error("Request is already being processed");
      setIsProcessing(false);
      return false; // Someone else got the lock
    }
  }

  // Unlock the request (set to idle) to be used by other agent/user
  async function unlockRequest() {
    setLoading(true);
    await supabase
      .from(tableName)
      .update({
        [statusCol]: "idle",
        [byCol]: null,
        [atCol]: null,
      })
      .eq("id", requestId);
    setIsProcessing(false);
    setLoading(false);
  }

  // Approve the request (set to next process_status and unlock) to be used by other agent/user
  async function approveRequest(nextProcessStatus: string) {
    setLoading(true);
    await supabase
      .from(tableName)
      .update({
        process_status: nextProcessStatus,
        [statusCol]: "idle",
        [byCol]: null,
        [atCol]: null,
      })
      .eq("id", requestId);
    setIsProcessing(false);
    setLoading(false);
  }

  return {
    isProcessing,
    loading,
    lockRequest,
    unlockRequest,
    approveRequest,
  };
} 