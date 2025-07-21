import { useMutation } from "@tanstack/react-query";
import { assignRedeemToRecharge } from "~/services/redeem-assign.service";

export function useAssignRedeem() {
  return useMutation({
    mutationFn: async ({
      rechargeId,
      redeemId,
      amountHold,
      rechargeAmount,
    }: {
      rechargeId: string;
      redeemId: string;
      amountHold: number;
      rechargeAmount: number;
    }) => {
      return assignRedeemToRecharge({
        rechargeId,
        redeemId,
        amountHold,
        rechargeAmount,
      });
    },
  });
}
