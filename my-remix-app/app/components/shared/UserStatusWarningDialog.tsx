import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

interface UserStatusWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  currentStatus: string;
  newStatus: string;
  isLoading?: boolean;
  customDescription?: string;
  customTitle?: string;
  customConfirmText?: string;
  actionType?: "danger" | "warning" | "success" | "info";
  statusConfig?: {
    [key: string]: {
      title: string;
      description: string;
      confirmText: string;
      color: "danger" | "warning" | "success" | "info";
    };
  };
}

export function UserStatusWarningDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  currentStatus,
  newStatus,
  isLoading = false,
  customDescription,
  customTitle,
  customConfirmText,
  actionType,
  statusConfig,
}: UserStatusWarningDialogProps) {
  // Default status configurations
  const defaultStatusConfig = {
    banned: {
      title: "Ban User",
      description: `Are you sure you want to ban "${userName}"? This action will:
• Prevent the user from accessing the platform
• Disable all user activities and transactions
• Require manual reactivation to restore access`,
      confirmText: "Ban User",
      color: "danger" as const,
    },
    active: {
      title: "Activate User",
      description: `Are you sure you want to activate "${userName}"? This will:
• Restore the user's access to the platform
• Allow all user activities and transactions
• Enable normal platform functionality`,
      confirmText: "Activate User",
      color: "success" as const,
    },
    suspended: {
      title: "Suspend User",
      description: `Are you sure you want to suspend "${userName}"? This action will:
• Temporarily restrict user access
• Pause all user activities
• Allow for quick reactivation`,
      confirmText: "Suspend User",
      color: "warning" as const,
    },
    pending: {
      title: "Set User to Pending",
      description: `Are you sure you want to set "${userName}" to pending status? This will:
• Place user in a waiting state
• Require approval for full access
• Limit user activities`,
      confirmText: "Set to Pending",
      color: "warning" as const,
    },
  };

  // Merge default config with custom config
  const mergedConfig = { ...defaultStatusConfig, ...statusConfig };

  // Get configuration for the new status
  const statusInfo = mergedConfig[newStatus as keyof typeof mergedConfig] || {
    title: `Change Status to ${newStatus}`,
    description: `Are you sure you want to change the status of "${userName}" from "${currentStatus}" to "${newStatus}"? This action may affect the user's platform access and permissions.`,
    confirmText: `Set to ${newStatus}`,
    color: actionType || "info",
  };

  const getTitle = () => {
    if (customTitle) return customTitle;
    return statusInfo.title;
  };

  const getDescription = () => {
    if (customDescription) return customDescription;
    return statusInfo.description;
  };

  const getConfirmText = () => {
    if (customConfirmText) return customConfirmText;
    return statusInfo.confirmText;
  };

  const getButtonColor = () => {
    switch (statusInfo.color) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "info":
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  const getCancelText = () => {
    return "Cancel";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#1a1a1a] border border-gray-700 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-white">
            {getTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
            disabled={isLoading}
          >
            {getCancelText()}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={getButtonColor()}
          >
            {isLoading ? "Processing..." : getConfirmText()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
