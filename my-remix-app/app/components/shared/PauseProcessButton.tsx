import { useState } from "react";
import { Button } from "../ui/button";
import { supabase } from "../../hooks/use-auth";
import { toast } from "sonner";
import { X } from "lucide-react";

interface PauseProcessButtonProps {
  requestId: string;
  status: string;
  department: "operation" | "verification" | "finance";
  requestType: "redeem" | "recharge";
  onPaused: () => void;
  userRole?: string;
  children?: React.ReactNode;
}

export function PauseProcessButton({
  requestId,
  status,
  department,
  requestType,
  onPaused,
  userRole,
  children,
}: PauseProcessButtonProps) {
  const [loading, setLoading] = useState(false);

  // Only show button for executives and managers
  const canPause = userRole === "executive" || userRole === "manager" || userRole === "admin";
  
  // Only show button when status is "in_process"
  const shouldShow = status === "in_process" && canPause;

  // Dynamic column names based on request type and department
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

  const handlePause = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("User not authenticated");
        return;
      }

      // Update status from "in_process" to "idle"
      const { error } = await supabase
        .from(tableName)
        .update({
          [statusCol]: "idle",
          [byCol]: null,
          [atCol]: null,
        })
        .eq("id", requestId)
        .eq(statusCol, "in_process");

      if (error) {
        toast.error("Failed to pause processing");
        console.error("Pause error:", error);
      } else {
        toast.success("Processing paused successfully");
        onPaused();
      }
    } catch (error) {
      toast.error("An error occurred while pausing");
      console.error("Pause error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePause}
      disabled={loading}
      className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </Button>
  );
} 