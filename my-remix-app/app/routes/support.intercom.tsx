import PrivateRoute from "~/components/private-route";

export default function SupportPage() {
  return (
      <PrivateRoute department="support">
        <div>Support Intercom</div>
      </PrivateRoute>
  );  
}
