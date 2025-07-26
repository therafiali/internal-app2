import { useParams } from "@remix-run/react";
import PrivateRoute from "~/components/private-route";
import RechargeTab from "../components/tabs/user-activity/recharge";
import RedeemTab from "../components/tabs/user-activity/redeem";
import TransferTab from "../components/tabs/user-activity/transfer";
import ResetPasswordTab from "../components/tabs/user-activity/resetpassword";
import NewAccountTab from "../components/tabs/user-activity/newaccount";
import { TeamProvider } from "../components/tabs/user-activity/TeamContext";

export default function SupportUserActivityTab() {
  const { tab } = useParams();

  let content = null;
  if (tab === "recharge") {
    content = <RechargeTab activeTab="recharge" />;
  } else if (tab === "redeem") {
    content = <RedeemTab type="pending" activeTab="redeem" />;
  } else if (tab === "transfer") {
    content = <TransferTab type="pending" activeTab="transfer" />;
  } else if (tab === "resetpassword") {
    content = <ResetPasswordTab type="pending" activeTab="resetpassword" />;
  } else if (tab === "newaccount") {
    content = <NewAccountTab type="pending" activeTab="newaccount" />;
  } else {
    content = <RechargeTab activeTab="recharge" />;
  }

  return (
    <TeamProvider>
      <PrivateRoute toDepartment="support">{content}</PrivateRoute>
    </TeamProvider>
  );
}
