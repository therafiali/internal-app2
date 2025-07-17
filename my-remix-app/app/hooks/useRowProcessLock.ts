import { useState, useCallback } from "react";
import { supabase } from "../hooks/use-auth";

export type UseRowProcessLockOptions = {
  table: string;
  rowId: string;
  processStatusColumn?: string; // default: "operation_redeem_process_status"
  processByColumn?: string;     // default: "operation_redeem_process_by"
  processAtColumn?: string;     // default: "operation_redeem_process_at"
};

export type UseRowProcessLockResult = {
  isLocked: boolean;
  lockedBy: string | null;
  lockStatus: string | null;
  processRow: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useRowProcessLock({
  table,
  rowId,
  processStatusColumn = "operation_redeem_process_status",
  processByColumn = "operation_redeem_process_by",
  processAtColumn = "operation_redeem_process_at",
}: UseRowProcessLockOptions): UseRowProcessLockResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockStatus, setLockStatus] = useState<string | null>(null);
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  // Fetch lock status
  const fetchLock = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from(table)
      .select(`${processStatusColumn}, ${processByColumn}`)
      .eq("id", rowId);
    setLoading(false);
    if (fetchError) {
      setError(fetchError.message);
      setLockStatus(null);
      setLockedBy(null);
      return;
    }
    if (data && data[0]) {
      setLockStatus(data[0][processStatusColumn] || null);
      setLockedBy(data[0][processByColumn] || null);
    } else {
      setLockStatus(null);
      setLockedBy(null);
    }
  }, [table, rowId, processStatusColumn, processByColumn]);

  // Try to acquire the lock
  const processRow = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Refetch to check current status
    const { data: rowData, error: fetchError } = await supabase
      .from(table)
      .select(`${processStatusColumn}, ${processByColumn}`)
      .eq("id", rowId);
    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return false;
    }
    if (
      rowData &&
      rowData[0] &&
      rowData[0][processStatusColumn] === "in_process"
    ) {
      setLockStatus("in_process");
      setLockedBy(rowData[0][processByColumn] || null);
      setLoading(false);
      return false;
    }
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("User not authenticated");
      setLoading(false);
      return false;
    }
    const currentUserId = userData.user.id;
    // Update row to set in_process
    const { error: updateError } = await supabase
      .from(table)
      .update({
        [processStatusColumn]: "in_process",
        [processByColumn]: currentUserId,
        [processAtColumn]: new Date().toISOString(),
      })
      .eq("id", rowId);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    setLockStatus("in_process");
    setLockedBy(currentUserId);
    return true;
  }, [table, rowId, processStatusColumn, processByColumn, processAtColumn]);

  // Initial fetch
  // (You can add useEffect here if you want auto-fetch on mount)

  return {
    isLocked: lockStatus === "in_process",
    lockedBy,
    lockStatus,
    processRow,
    loading,
    error,
    refetch: fetchLock,
  };
} 