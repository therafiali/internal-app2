import PrivateRoute from "~/components/private-route";

export default function VerificationRechargePage() {
  return (
    <PrivateRoute department="verification">
      <div>Verification Recharge</div>
    </PrivateRoute>
  );
}
