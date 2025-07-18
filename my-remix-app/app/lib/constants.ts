// 
export enum RechargeProcessStatus {
  FINANCE = "0",
  SUPPORT = "1",
  VERIFICATION = "2",
  OPERATION = "3",
  COMPLETED = "4",
  CANCELLED = "-1"
}
export enum RedeemProcessStatus {
  OPERATION = "0",
  VERIFICATION = "1",
  FINANCE = "2",
  FINANCE_PARTIALLY_PAID = '4',
  COMPLETED = "5",
  CANCELLED = "-1",
  OPERATIONFAILED="7",
  VERIFICATIONFAILED="8",
  FINANCEFAILED="9",
}
// object to map the status to the name 
const statusMap = {
  [RechargeProcessStatus.FINANCE]: "FINANCE",
  [RechargeProcessStatus.SUPPORT]: "SUPPORT",
  [RechargeProcessStatus.VERIFICATION]: "VERIFICATION",
  [RechargeProcessStatus.OPERATION]: "OPERATION",
  [RechargeProcessStatus.COMPLETED]: "COMPLETED",
  [RechargeProcessStatus.CANCELLED]: "CANCELLED"
}
// function to return the status name
export function getStatusName(status: string) {
  return statusMap[status as keyof typeof statusMap] || "-";
}

export function getRechargeType(process_status: string) {
  if (process_status === RechargeProcessStatus.FINANCE) {
    return "Assignment Pending";
  } else if (process_status === RechargeProcessStatus.SUPPORT) {
    return "Assigned";
  } else if (process_status === RechargeProcessStatus.VERIFICATION) {
    return "Screenshots Submitted";
  }
}
