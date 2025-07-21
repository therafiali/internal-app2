import { useParams, useNavigate } from "@remix-run/react";
import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft, User, Phone, MapPin, Globe, Hash, Crown } from "lucide-react";

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Helper function to find user by slug
function findUserBySlug(players: any[], userSlug: string) {
  return players?.find(player => {
    const fullName = player.firstname && player.lastname
      ? `${player.firstname} ${player.lastname}`.trim()
      : player.firstname || player.fullname || "";
    
    const slug = createSlug(fullName);
    return slug === userSlug;
  });
}

function UserDetailPage() {
  const { userSlug } = useParams();
  const navigate = useNavigate();
  const { data: players } = useFetchPlayer();
  
  // Find the specific user by slug
  const user = findUserBySlug(players, userSlug || '');
  
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
        
        <div className="grid gap-6 mt-6">
          {/* Profile Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Full Name</label>
                  <p className="text-white">{fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Gender</label>
                  <p className="text-white capitalize">{user.gender || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Language</label>
                  <p className="text-white">{user.language || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Timezone</label>
                  <p className="text-white">{user.timezone || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Team Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Phone className="h-5 w-5" />
                Contact & Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Phone</label>
                  <p className="text-white">{user.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Team</label>
                  <p className="text-white">{user.teams?.team_code || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Messenger ID</label>
                  <p className="text-white">{user.messenger_id || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">VIP Code</label>
                  <p className="text-white flex items-center gap-1">
                    {user.vip_code ? (
                      <>
                        <Crown className="h-4 w-4 text-yellow-500" />
                        {user.vip_code}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Hash className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">User ID</label>
                  <p className="text-white font-mono text-sm">{user.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Team ID</label>
                  <p className="text-white font-mono text-sm">{user.team_id || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PrivateRoute>
  );
}

export default UserDetailPage; 