import { supabase } from "~/hooks/use-auth";
import { RechargeProcessStatus } from "~/lib/constants";
import { useAuth } from "~/hooks/use-auth";

export const assignCompanyTag = async (recharge_id: string, tag_id: string) => {
    // const { user } = useAuth();
    const { error } = await supabase
        .from("recharge_requests")
        .update({ target_id: tag_id, process_status: RechargeProcessStatus.SUPPORT })
        .eq("id", recharge_id);


    // const { data: rechargeData } = await supabase
    //     .from("recharge_requests")
    //     .select("balance")
    //     .eq("id", recharge_id);

    // const recharge_amount = rechargeData?.[0]?.balance;

    // const { error: companyTagError } = await supabase
    //     .from("company_tags")
    //     .update({ balance: Number(rechargeData?.[0]?.balance) + Number(recharge_amount) })
    //     .eq("tag_id", tag_id);

    // const { error: rechargeError } = await supabase
    //     .from("ct_activity_logs")
    //     .insert({
    //         tag_id: tag_id,
    //         action_type: "deposit",
    //         action_description: `Deposit request ${recharge_id} assigned to company tag ${tag_id}`,
    //         status: "assigned",
    //         user_id: user?.id,
    //         amount: recharge_amount,
    //         balance_before: Number(rechargeData?.[0]?.balance),
    //         balance_after: Number(rechargeData?.[0]?.balance) + Number(recharge_amount),
    //         target_id: recharge_id,
    //     });

    if (error) {
        console.error('Supabase error in assignCompanyTag:', error);
        throw error;
    }


    return { success: true };
};