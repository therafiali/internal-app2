import { supabase } from "~/hooks/use-auth";

export interface HoldRedeemInput {
  redeemId: string;
  holdAmount: number;
  paymentMethod: string;
  cashtag: string;
  // identifier: string;
  notes?: string;
  user_id: string;
}

export async function holdRedeemRequest({
  redeemId,
  holdAmount,
  paymentMethod,
  cashtag,
  notes,
  user_id,
}: HoldRedeemInput) {
  console.log("paymentMethod", paymentMethod);
  console.log("cashtag", cashtag);
  console.log("notes", notes);
  console.log("holdAmount", holdAmount);
  console.log("redeemId", redeemId);
  console.log("user_id", user_id);

  const { data: redeemRequest, error: redeemRequestError } = await supabase
    .from("redeem_requests")
    .select("amount_paid, amount_hold")
    .eq("redeem_id", redeemId)
    .single();

  if (redeemRequestError) {
    throw new Error(
      `Error getting redeem request: ${redeemRequestError.message}`
    );
  }

  const newAmountPaid = Number(redeemRequest.amount_paid) + Number(holdAmount);
  const newAmountHold = Number(redeemRequest.amount_hold) - Number(holdAmount);
  

  const { error } = await supabase
    .from("redeem_requests")
    .update({
      amount_paid: newAmountPaid,
      amount_hold: newAmountHold,
      updated_at: new Date().toISOString(),
    })
    .eq("redeem_id", redeemId)
    .select();

  if (error) {
    throw new Error(`Error holding redeem: ${error.message}`);
  }

  const { data: companyTagData, error: companyTagError } = await supabase
    .from("company_tags")
    .select("balance")
    .eq("tag_id", cashtag)
    .single();
    
    if (companyTagError) {
      throw new Error(`Error getting company tag: ${companyTagError.message}`);
    }

    const afterBalance = Number(companyTagData?.balance) - Number(holdAmount);

    const { error: companyTagError2 } = await supabase
      .from("company_tags")
      .update({ balance: afterBalance })
      .eq("tag_id", cashtag);


      if (companyTagError2) {
        throw new Error(`Error updating company tag: ${companyTagError2.message}`);
      }

  const { error: redeemError } = await supabase
    .from("ct_activity_logs")
    .insert({
      tag_id: cashtag,
      action_type: "withdraw",
      action_description: `Withdraw redeem request ${redeemId} assigned to company tag ${cashtag}`,
      status: "success",
      user_id: user_id,
      amount: holdAmount,
      balance_before: Number(companyTagData?.balance),
      balance_after: afterBalance,
      target_id: redeemId,
    });

    if (redeemError) {
      throw new Error(`Error inserting redeem activity log: ${redeemError.message}`);
    }

  return { success: true };
}
