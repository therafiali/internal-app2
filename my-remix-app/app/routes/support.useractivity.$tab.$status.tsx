import { useParams } from "@remix-run/react";
import PrivateRoute from "~/components/private-route";
import RechargeTab from "../components/tabs/user-activity/recharge";
import RedeemTab from "../components/tabs/user-activity/redeem";

export default function SupportUserActivityTabStatus() {
  const { tab, status } = useParams();

  let content = null;
  if (tab === "recharge") {
    content = <RechargeTab activeTab="recharge" />;
  } else if (tab === "redeem") {
    content = <RedeemTab type={status || "pending"} activeTab="redeem" />;
  } else {
    content = <RechargeTab activeTab="recharge" />;
  }

  return (
    <PrivateRoute toDepartment="support">
      {content}
    </PrivateRoute>
  );
} 