import { supabase } from "../hooks/use-auth";
import { RechargeProcessStatus, RedeemProcessStatus } from "../lib/constants";
import type { RechargeRequest } from "../routes/verification.recharge";

export async function processRechargeRequest({
  selectedRow,
}: {
  selectedRow: RechargeRequest;
}) {
  // Fetch redeem data
  const { data: redeemData } = await supabase
    .from("redeem_requests")
    .select("*")
    .eq("redeem_id", selectedRow.target_id);

  const prevRedeemPaidAmount = redeemData?.[0]?.amount_paid || 0;
  const prevRedeemHoldAmount = redeemData?.[0]?.amount_hold || 0;
  const newPaidAmount =
    Number(selectedRow.amount || 0) + Number(prevRedeemPaidAmount);
  const newHoldAmount =
    Number(prevRedeemHoldAmount) - Number(selectedRow.amount || 0);

  // Update recharge_requests
  await supabase
    .from("recharge_requests")
    .update({ process_status: RechargeProcessStatus.OPERATION })
    .eq("id", selectedRow.id);

  // Update redeem_requests
  await supabase
    .from("redeem_requests")
    .update({
      amount_paid: newPaidAmount,
      amount_hold: newHoldAmount,
      process_status:
        newPaidAmount === redeemData?.[0]?.total_amount
          ? RedeemProcessStatus.COMPLETED
          : RedeemProcessStatus.FINANCE_PARTIALLY_PAID,
    })
    .eq("redeem_id", selectedRow.target_id);
}
