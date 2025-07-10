import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { useAuthContext } from "./auth-provider";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";

export function Profile() {
  const { user, signOut, isAuthenticated } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate("/auth/signin");
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-700"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={user.user_metadata?.avatar_url} 
              alt={user.user_metadata?.full_name || user.email}
            />
            <AvatarFallback className="bg-blue-600 text-white">
              {getUserInitials(user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Profile</DialogTitle>
          <DialogDescription className="text-gray-400">
            Your account information and settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={user.user_metadata?.avatar_url} 
                alt={user.user_metadata?.full_name || user.email}
              />
              <AvatarFallback className="bg-blue-600 text-white text-lg">
                {getUserInitials(user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">
                {user.user_metadata?.full_name || "User"}
              </h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Account Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Account Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">User ID:</span>
                <span className="text-sm text-white font-mono">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Email:</span>
                <span className="text-sm text-white">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Member since:</span>
                <span className="text-sm text-white">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 