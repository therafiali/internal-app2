import { useParams, useNavigate, useSearchParams } from "@remix-run/react";
import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft, User, Phone, MapPin, Globe, Hash, Crown } from "lucide-react";
import RedeemHistory from "~/components/user-detail/RedeemHistory";
import RechargeHistory from "~/components/user-detail/RechargeHistory";

function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: players } = useFetchPlayer();
  
  // Get the user ID from query parameters
  const userIdFromQuery = searchParams.get('id');
  
  // Find the specific user by ID from query params
  const user = players?.find(player => player.id === userIdFromQuery);
  
  if (!user) {
    return (
      <PrivateRoute toDepartment="support">
        <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate("/support/userlist")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to User List
            </Button>
          </div>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-500 mb-4">User Not Found</h2>
            <p className="text-gray-400">The user you're looking for doesn't exist.</p>
          </div>
        </div>
      </PrivateRoute>
    );
  }

  const fullName = user.firstname && user.lastname
    ? `${user.firstname} ${user.lastname}`.trim()
    : user.firstname || user.fullname || "N/A";

  return (
    <PrivateRoute toDepartment="support">
      <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/support/userlist")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to User List
          </Button>
        </div>
        
        <DynamicHeading title={`User Details - ${fullName}`} />
        
        
      </div>
    </PrivateRoute>
  );
}

export default UserDetailPage; 