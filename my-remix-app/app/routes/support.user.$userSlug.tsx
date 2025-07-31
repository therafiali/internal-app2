import { useParams, useNavigate } from "@remix-run/react";
import PrivateRoute from "~/components/private-route";
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  ArrowLeft,
  User,
  Briefcase,
  Clock,
  Calendar,
  Eye,
  CheckCircle,
  Edit,
  Wallet,
  DollarSign,
  Shield,
  Tag,
  Bell,
} from "lucide-react";
import RedeemHistory from "~/components/user-detail/RedeemHistory";
import RechargeHistory from "~/components/user-detail/RechargeHistory";
import EditGameUsernamesModal from "~/components/user-detail/EditGameUsernamesModal";
import { PaymentMethodManager } from "~/components/PaymentMethodManager";
import { useFetchGameUsernames } from "~/hooks/api/queries/useFetchGames";
import { useState } from "react";
import { useFetchPlayerPaymentMethodDetail } from "~/hooks/api/queries/useFetchPlayerPaymentMethodDetail";
import ImagePreview from "~/components/shared/ImagePreview";

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

// Helper function to find user by slug
function findUserBySlug(players: any[] | undefined, userSlug: string) {
  return players?.find((player) => {
    const fullName =
      player.firstname && player.lastname
        ? `${player.firstname} ${player.lastname}`.trim()
        : player.firstname || player.fullname || "";

    const slug = createSlug(fullName);
    return slug === userSlug;
  });
}

// User Profile Sidebar Component
function UserProfileSidebar({
  user,
  onEditUsernames,
}: {
  user: any;
  onEditUsernames: () => void;
}) {
  const fullName =
    user.firstname && user.lastname
      ? `${user.firstname} ${user.lastname}`.trim()
      : user.firstname || user.fullname || "N/A";

  const userInitials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="flex-shrink-0 h-full">
      <div className="p-6 bg-gray-800 rounded-2xl w-80 h-full shadow-lg ml-8 mt-6">
        {/* Navigation */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 bg-gray-700 p-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>

        {/* Profile Header */}
        <div className="text-center mb-6">
          <Avatar className="w-24 h-24 mx-auto mb-4 shadow-lg">
            <AvatarImage src={user.profilepic} alt={fullName} />
            <AvatarFallback className="bg-purple-600 text-white text-2xl">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-white mb-1">{fullName}</h1>
          {/* <p className="text-gray-400 text-sm">{user.id}</p> */}
        </div>

        {/* User Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <Briefcase className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300">Team:</span>
            <Badge variant="secondary" className="bg-purple-600 text-white">
              {/* show team code in uppercase */}
              <span className="text-white uppercase">
                {user.teams?.team_code || "N/A"}
              </span>
            </Badge>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300">Gender:</span>
            <span className="text-white capitalize">
              {user.gender || "N/A"}
            </span>
          </div>

          {/* <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300">Joined:</span>
            <span className="text-white">7/1/2025</span>
          </div> */}

          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <Eye className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300">Last Login:</span>
            <span className="text-white">{user.last_login || "N/A"}</span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <CheckCircle className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300">Status:</span>
            <span className="text-white0">{user.active_status || "N/A"}</span>
          </div>
        </div>

        {/* Game Usernames */}
        <GameUsernamesSection
          userId={user.id}
          onEditUsernames={onEditUsernames}
        />

        {/* Payment Methods */}
        <PaymentMethodsSection
          userId={user.id}
          playerName={
            user.firstname && user.lastname
              ? `${user.firstname} ${user.lastname}`.trim()
              : user.firstname || user.fullname || "N/A"
          }
        />
      </div>
    </aside>
  );
}

// Game Usernames Section Component
function GameUsernamesSection({
  userId,
  onEditUsernames,
}: {
  userId: string;
  onEditUsernames: () => void;
}) {
  const { data: gameUsernames } = useFetchGameUsernames(userId);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Game Usernames</h3>
        <Edit
          onClick={onEditUsernames}
          className="h-4 w-4 text-gray-400 cursor-pointer hover:text-white"
        />
      </div>
      <div className="space-y-2">
        {gameUsernames?.data && gameUsernames.data.length > 0 ? (
          gameUsernames.data.map((item: any) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">
                {item.games?.game_name?.toUpperCase()}:
              </span>
              <span className="text-blue-400 text-sm">
                {item.game_username}
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-sm">No game usernames found</div>
        )}
      </div>
    </div>
  );
}

// Payment Methods Section Component
function PaymentMethodsSection({
  userId,
  playerName,
}: {
  userId: string;
  playerName: string;
}) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { data: playerPaymentMethods } =
    useFetchPlayerPaymentMethodDetail(userId);
  console.log(playerPaymentMethods, "playerPaymentMethods");

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4  w-full ">
        <h3 className="text-lg font-semibold text-white">Payment Methods</h3>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPaymentModalOpen(true)}
          className="text-blue-400 hover:text-blue-300 p-1"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 w-full ">
        {playerPaymentMethods?.map((method: any) => (
          <div
            key={method.id}
            className="flex items-center justify-center gap-2 bg-gray-700 p-2 rounded-lg w-full "
          >
            <div className="text-gray-400 text-sm">
              {method.payment_method.payment_method}
            </div>
            <div className="text-gray-400 text-sm">•</div>
            <div className="text-gray-400 text-sm">{method.tag_name}</div>
            <div className="text-gray-400 text-sm">•</div>
            <div className="text-gray-400 text-sm"> {method.tag_id}</div>

            {method.qr_code && (
              <>
                <div className="text-gray-400 text-sm">•</div>
                <ImagePreview
                  src={method.qr_code}
                  alt={`QR Code for tag ${method.tag_id}`}
                  className="w-16 h-16"
                >
                  <div className="relative group">
                    <img
                      src={method.qr_code}
                      alt={`QR Code for tag ${method.tag_id}`}
                      className="w-8 h-8 object-cover border border-gray-600 rounded hover:border-blue-400 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center transition-all">
                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </ImagePreview>
              </>
            )}
          </div>
        ))}
      </div>

      <PaymentMethodManager
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        playerId={userId}
        playerName={playerName}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
}

function UserDetailPage() {
  const { userSlug } = useParams();
  const navigate = useNavigate();
  const { data: players } = useFetchPlayer();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find the specific user by slug
  const user = findUserBySlug(players, userSlug || "");

  const handleEditUsernames = () => {
    setIsModalOpen(true);
  };

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
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              User Not Found
            </h2>
            <p className="text-gray-400">
              The user you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute toDepartment="support">
      <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen flex">
        {/* Left Sidebar */}
        <UserProfileSidebar user={user} onEditUsernames={handleEditUsernames} />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* History Sections */}
          <div className="space-y-6">
            <RedeemHistory playerId={user?.id || ""} />
            <RechargeHistory playerId={user?.id || ""} />
          </div>
        </div>

        {/* Edit Game Usernames Modal */}
        <EditGameUsernamesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          playerId={user?.id || ""}
        />
      </div>
    </PrivateRoute>
  );
}

export default UserDetailPage;
