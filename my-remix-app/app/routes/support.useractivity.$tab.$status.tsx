import { useParams } from "@remix-run/react";
import PrivateRoute from "../components/private-route";
import RechargeTab from "../components/tabs/user-activity/recharge";
import RedeemTab from "../components/tabs/user-activity/redeem";
import ResetPasswordTab from "../components/tabs/user-activity/resetpassword";
import NewAccountTab from "../components/tabs/user-activity/newaccount";
import TransferTab from "../components/tabs/user-activity/transfer";

export default function SupportUserActivityTabStatus() {
  const { tab, status } = useParams();

  let content = null;
  if (tab === "recharge") {
    content = <RechargeTab activeTab="recharge" />;
  } else if (tab === "redeem") {
    content = <RedeemTab type={status || "pending"} activeTab="redeem" />;
  } else if (tab === "resetpassword") {
    content = <ResetPasswordTab type={status || "pending"} activeTab="resetpassword" />;
  } else if (tab === "newaccount") {
    content = <NewAccountTab type={status || "pending"} activeTab="newaccount" />;
  } else if (tab === "transfer") {
    content = <TransferTab type={status || "pending"} activeTab="transfer" />;
  } else {
    content = <RechargeTab activeTab="recharge" />;
  }

  return (
    <PrivateRoute toDepartment="support">
      {content}
    </PrivateRoute>
  );
} 