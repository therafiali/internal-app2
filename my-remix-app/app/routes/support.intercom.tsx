import PrivateRoute from "~/components/private-route";
import { useAuth } from "~/hooks/use-auth";

// 
export default function SupportPage() {
  // useAuth
  const { user, loading } = useAuth();
  console.log(user?.user_metadata?.department, " Support.Intercom");
  return (
      <PrivateRoute toDepartment="support">
        <div>Support Intercom</div>
      </PrivateRoute>
  );  
}
