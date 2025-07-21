import { supabase } from "../hooks/use-auth";
import { RechargeProcessStatus } from "../lib/constants";
// import { useAuth } from "../hooks/use-auth";

export const assignCompanyTag = async (recharge_id: string, tag_id: string) => {
  // const { user } = useAuth();
  const { error } = await supabase
    .from("recharge_requests")
    .update({
      target_id: tag_id,
      process_status: RechargeProcessStatus.SUPPORT,
      ct_type: "ct",
    })
    .eq("id", recharge_id);

  // const { data: rechargeData } = await supabase
  //     .from("recharge_requests")
  //     .select("amount")
  //     .eq("id", recharge_id);

  // if (error) {
  //     console.error('Supabase error in assignCompanyTag:', error);
  //     throw error;
  // }

  // const { data: companyTagData, error:companyTagError2     } = await supabase
  //     .from("company_tags")
  //     .select("balance")
  //     .eq("tag_id", tag_id);

  // const afterBalance = Number(rechargeData?.[0]?.amount) + Number(companyTagData?.[0]?.balance);

  // const { error: companyTagError } = await supabase
  //     .from("company_tags")
  //     .update({ balance: afterBalance })
  //     .eq("tag_id", tag_id);

  // const { error: rechargeError } = await supabase
  //     .from("ct_activity_logs")
  //     .insert({
  //         tag_id: tag_id,
  //         action_type: "deposit",
  //         action_description: `Deposit request ${recharge_id} assigned to company tag ${tag_id}`,
  //         status: "assigned",
  //         user_id: user?.id,
  //         amount: rechargeData?.[0]?.amount,
  //         balance_before: Number(companyTagData?.[0]?.balance),
  //         balance_after: afterBalance,
  //         target_id: recharge_id,
  //     });

  if (error) {
    console.error("Supabase error in assignCompanyTag:", error);
    throw error;
  }

  return { success: true };
};

export const financeConfirmRecharge = async (
  recharge_id: string,
  amount: number,
  tag_id: string,
  user_id: string
) => {

  console.log("financeConfirmRecharge", recharge_id, amount, tag_id, user_id);
  const { data: companyTagData, error: companyTagError2 } = await supabase
    .from("company_tags")
    .select("balance")
    .eq("tag_id", tag_id);



  const afterBalance = Number(amount) + Number(companyTagData?.[0]?.balance);


  const { error: companyTagError } = await supabase
    .from("company_tags")
    .update({ balance: afterBalance })
    .eq("tag_id", tag_id);

  const { error: rechargeError } = await supabase
    .from("ct_activity_logs")
    .insert({
      tag_id: tag_id,
      action_type: "deposit",
      action_description: `Deposit request ${recharge_id} assigned to company tag ${tag_id}`,
      status: "success",
      user_id: user_id,
      amount: amount,
      balance_before: Number(companyTagData?.[0]?.balance),
      balance_after: afterBalance,
      target_id: recharge_id,
    });

  if (companyTagError || companyTagError2 || rechargeError) {
    throw companyTagError || companyTagError2 || rechargeError;
  }

  return { success: true };
};
