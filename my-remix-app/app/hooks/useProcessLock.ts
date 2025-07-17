import { useState } from "react";
import { supabase } from "./use-auth";

export function useProcessLock(requestId: string, department: "operation" | "verification" | "finance") {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic column names
  const statusCol = `${department}_redeem_process_status`;
  const byCol = `${department}_redeem_process_by`;
  const atCol = `${department}_redeem_process_at`;

  // Try to lock the request for processing
  async function lockRequest() {
    setLoading(true);
    // Fetch current status
    const { data, error } = await supabase
      .from("redeem_requests")
      .select(`${statusCol}, ${byCol}`)
      .eq("id", requestId)
      .single();
    if (error || !data) {
      setLoading(false);
      return false;
    }
    // Safely check the dynamic property for 'in_process'
    const statusValue = ((data as unknown) as Record<string, unknown>)[statusCol];
    if (statusValue === "in_process") {
      setIsProcessing(true);
      setLoading(false);
      return false;
    }
    // Set to in_process
    const { error: updateError } = await supabase
      .from("redeem_requests")
      .update({
        [statusCol]: "in_process",
        [byCol]: null, // Optionally set to user id if available
        [atCol]: new Date().toISOString(),
      })
      .eq("id", requestId);
    setIsProcessing(!updateError);
    setLoading(false);
    return !updateError;
  }

  // Unlock the request (set to idle)
  async function unlockRequest() {
    setLoading(true);
    await supabase
      .from("redeem_requests")
      .update({
        [statusCol]: "idle",
        [byCol]: null,
        [atCol]: null,
      })
      .eq("id", requestId);
    setIsProcessing(false);
    setLoading(false);
  }

  // Approve the request (set to next process_status and unlock)
  async function approveRequest(nextProcessStatus: string) {
    setLoading(true);
    await supabase
      .from("redeem_requests")
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