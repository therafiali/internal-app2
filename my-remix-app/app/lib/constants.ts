// 
export enum RechargeProcessStatus {
  FINANCE = "0",
  SUPPORT = "1",
  VERIFICATION = "2",
  OPERATION = "3",
  COMPLETED = "4",
  CANCELLED = "-1",
  FINANCE_CONFIRMED = "5",
  VERIFICATIONREJECTED="16",
  VERIFICATIONPROCESSED="17",
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
  OPERATIONREJECTED="10"
}

export enum NewAccountProcessStatus {
  PENDING = "0",
  APPROVED = "1",
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
  } else if (process_status === RechargeProcessStatus.OPERATION) {
    return "Under Operation";
  } else if (process_status === RechargeProcessStatus.COMPLETED) {
    return "Completed";
  } else if (process_status === RechargeProcessStatus.CANCELLED) {
    return "Cancelled";
  } else if (process_status === RechargeProcessStatus.FINANCE_CONFIRMED) {
    return "Finance Confirmed";
  } else if (process_status === RechargeProcessStatus.VERIFICATIONREJECTED) {
    return "Verification Rejected";
  }
  return "Unknown";
}

export function getRedeemType(process_status: string) {
  if (process_status === RedeemProcessStatus.OPERATION) {
    return "Pending";
  } else if (process_status === RedeemProcessStatus.VERIFICATION) {
    return "Under Verification";
  } else if (process_status === RedeemProcessStatus.FINANCE) {
    return "Under Finance Review";
  } else if (process_status === RedeemProcessStatus.FINANCE_PARTIALLY_PAID) {
    return "Partially Paid";
  } else if (process_status === RedeemProcessStatus.COMPLETED) {
    return "Completed";
  } else if (process_status === RedeemProcessStatus.CANCELLED) {
    return "Cancelled";
  } else if (process_status === RedeemProcessStatus.OPERATIONFAILED) {
    return "Operation Failed";
  } else if (process_status === RedeemProcessStatus.VERIFICATIONFAILED) {
    return "Verification Failed";
  } else if (process_status === RedeemProcessStatus.FINANCEFAILED) {
    return "Finance Failed";
  } else if (process_status === RedeemProcessStatus.OPERATIONREJECTED) {
    return "Operation Rejected";
  }
  return "Unknown";
}

export enum TransferRequestStatus {
  PENDING = "1",
  COMPLETED = "2",
  CANCELLED = "3",
}
export enum ResetPasswordRequestStatus {
  PENDING = "0",
  COMPLETED = "1",
  CANCELLED = "-1",
}



// PENDING(UNDER VERIFICATION)
// PENDING(VERIFIED)
// PENDING()
