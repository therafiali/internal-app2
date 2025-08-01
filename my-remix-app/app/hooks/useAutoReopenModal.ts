import { useEffect } from "react";
import { supabase } from "./use-auth";

interface UseAutoReopenModalOptions {
  tableName: string;
  processByColumn: string;
  processStatusColumn: string;
  data: any[];
  open: boolean;
  setSelectedRow: (row: any) => void;
  setOpen: (open: boolean) => void;
}

export function useAutoReopenModal({
  tableName,
  processByColumn,
  processStatusColumn,
  data,
  open,
  setSelectedRow,
  setOpen,
}: UseAutoReopenModalOptions) {
  useEffect(() => {
    const checkUserLocks = async () => {
      // Only run if data is loaded and not already processing
      if (!data || data.length === 0 || open) return;

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        // Different query based on table type
        const isRechargeTable = tableName === "recharge_requests";
        const paymentMethodColumn = isRechargeTable
          ? "payment_method_id"
          : "payment_methods_id";

        const { data: lockedRequests } = await supabase
          .from(tableName)
          .select(
            `
            *,
            teams:team_id(team_code),
            players:player_id(fullname),
            payment_methods:${paymentMethodColumn}(payment_method),
            games:game_id(game_name)
          `
          )
          .eq(processByColumn, userData.user.id)
          .eq(processStatusColumn, "in_process");

        if (lockedRequests && lockedRequests.length > 0) {
          // Map database data to proper format based on table type
          if (tableName === "redeem_requests") {
            // Map for redeem requests
            const mappedRow = {
              id: lockedRequests[0].id,
              pendingSince: lockedRequests[0].created_at || "-",
              teamCode: (
                lockedRequests[0].teams?.team_code || "-"
              ).toUpperCase(),
              redeemId: lockedRequests[0].redeem_id || "-",
              platform: lockedRequests[0].games?.game_name || "-",
              user: lockedRequests[0].players?.fullname || "-",
              initBy: "-",
              totalAmount: lockedRequests[0].total_amount
                ? `${lockedRequests[0].total_amount}`
                : "0",
              paidAmount: lockedRequests[0].amount_paid
                ? `${lockedRequests[0].amount_paid}`
                : "0",
              holdAmount: lockedRequests[0].amount_hold
                ? `${lockedRequests[0].amount_hold}`
                : "0",
              remainingAmount:
                lockedRequests[0].total_amount - lockedRequests[0].amount_paid
                  ? `${
                      lockedRequests[0].total_amount -
                      lockedRequests[0].amount_paid
                    }`
                  : "0",
              availableToHold: lockedRequests[0].amount_available
                ? `${lockedRequests[0].amount_available}`
                : "0",
              paymentMethod:
                lockedRequests[0].payment_methods?.payment_method || "-",
              finance_redeem_process_status:
                lockedRequests[0].finance_redeem_process_status || "pending",
              finance_redeem_process_by:
                lockedRequests[0].finance_redeem_process_by,
              finance_users: lockedRequests[0].finance_users,
              operation_redeem_process_status:
                lockedRequests[0].operation_redeem_process_status || "pending",
              operation_redeem_process_by:
                lockedRequests[0].operation_redeem_process_by,
              verification_redeem_process_status:
                lockedRequests[0].verification_redeem_process_status ||
                "pending",
              verification_redeem_process_by:
                lockedRequests[0].verification_redeem_process_by,
              hold_status: lockedRequests[0].hold_status || null,
              temp_hold_amount: lockedRequests[0].temp_hold_amount || null,
            };
            setSelectedRow(mappedRow);
          } else if (tableName === "recharge_requests") {
            console.log("lockedRequests", lockedRequests);
            // Map for recharge requests
            const mappedRow = {
              id: lockedRequests[0].id,
              pendingSince: lockedRequests[0].created_at || "-",
              teamCode: (
                lockedRequests[0].teams?.team_code || "-"
              ).toUpperCase(),
              paymentMethod:
                lockedRequests[0].payment_methods?.payment_method || "-",
              rechargeId: lockedRequests[0].recharge_id || "-",
              platform: lockedRequests[0].games?.game_name || "-",
              user: lockedRequests[0].players?.fullname || "-",
              amount: lockedRequests[0].amount
                ? `${lockedRequests[0].amount}`
                : "0",
              operation_recharge_process_status:
                lockedRequests[0].operation_recharge_process_status ||
                "pending",
              operation_recharge_process_by:
                lockedRequests[0].operation_recharge_process_by,
              verification_recharge_process_status:
                lockedRequests[0].verification_recharge_process_status ||
                "pending",
              verification_recharge_process_by:
                lockedRequests[0].verification_recharge_process_by,
              finance_recharge_process_status:
                lockedRequests[0].finance_recharge_process_status || "pending",
              finance_recharge_process_by:
                lockedRequests[0].finance_recharge_process_by,
            };
            setSelectedRow(mappedRow);
          }

          setOpen(true);
        }
      }
    };

    checkUserLocks();
  }, [
    data,
    open,
    tableName,
    processByColumn,
    processStatusColumn,
    setSelectedRow,
    setOpen,
  ]);
}
