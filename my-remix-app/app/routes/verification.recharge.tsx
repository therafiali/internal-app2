import PrivateRoute from "~/components/private-route";

export default function VerificationRechargePage() {
  return (
    <PrivateRoute toDepartment="verification">
      <div>Verification Recharge</div>
    </PrivateRoute>
  );
}
