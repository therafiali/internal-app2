import React, { useState, useEffect } from "react";
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";
import DynamicHeading from "~/components/shared/DynamicHeading";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";

import SupportSubmitRequest from "~/components/submitrequest";
import { SubmitRedeemModal } from "~/components/SubmitRedeemModal";
import { useLocation, useNavigate } from "@remix-run/react";
import { useFetchCounts } from "~/hooks/api/queries/useFetchCounts";
import TransferRequestModal from "~/components/transferrequest";
import ResetPasswordModal from "~/components/resetpassword";
import NewAccountModal from "~/components/newaccount";

interface TabOption {
  label: string;
  value: string;
}

interface UserActivityLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabOptions: TabOption[];
  children: React.ReactNode;
}

// Dynamic Button Component
interface DynamicActionButtonProps {
  title: string;
  iconColor: string;
  borderColor: string;
  children: React.ReactNode;
}

const DynamicActionButton: React.FC<DynamicActionButtonProps> = ({
  title,
  iconColor,
  borderColor,
  children
}) => {
  return (
    <div className="flex flex-col items-center">
      <Button
        className={`bg-gray-800 hover:bg-gray-700 text-white border ${borderColor} shadow-lg ${borderColor.replace('border-', 'shadow-')} px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105 mb-4`}
      >
        <Plus className={`w-5 h-5 mr-2 ${iconColor}`} />
        {title}
      </Button>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

const UserActivityLayout: React.FC<UserActivityLayoutProps> = ({
  activeTab,
  onTabChange,
  tabOptions,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const urlStatus = location.pathname.split('/').pop() || 'pending';
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [pageIndex, setPageIndex] = useState(0);

  const { data: pendingRechargeCounts } = useFetchCounts("recharge_requests", ["0"]);
  const { data: liveRechargeCounts } = useFetchCounts("recharge_requests", ["1", "2", "3"]);
  const { data: completedRechargeCounts } = useFetchCounts("recharge_requests", ["4"]);

  const { data: pendingRedeemCounts } = useFetchCounts("redeem_requests", ["0"]);
  const { data: liveRedeemCounts } = useFetchCounts("redeem_requests", ["1", "2", "3", "4"]);
  const { data: completedRedeemCounts } = useFetchCounts("redeem_requests", ["5"]);

  const { data: pendingTransferCounts } = useFetchCounts("transfer_requests", ["0"]);
  // const { data: liveTransferCounts } = useFetchCounts("transfer_requests", ["1", "2", "3"]);
  const { data: completedTransferCounts } = useFetchCounts("transfer_requests", ["3"]);

  const { data: pendingResetPasswordCounts } = useFetchCounts("reset_password_requests", ["0"]);
  // const { data: liveResetPasswordCounts } = useFetchCounts("reset_password_requests", ["1", "2", "3"]);
  const { data: completedResetPasswordCounts } = useFetchCounts("reset_password_requests", ["3"]);

  const { data: pendingNewAccountCounts } = useFetchCounts("new_account_requests", ["0"]);
  // const { data: liveNewAccountCounts } = useFetchCounts("new_account_requests", ["1", "2", "3"]);
  const { data: completedNewAccountCounts } = useFetchCounts("new_account_requests", ["3"]);

  const [pendingRechargeCount, setPendingRechargeCount] = useState(pendingRechargeCounts?.length || 0);
  const [liveRechargeCount, setLiveRechargeCount] = useState(liveRechargeCounts?.length || 0);
  const [completedRechargeCount, setCompletedRechargeCount] = useState(completedRechargeCounts?.length || 0);

  const [pendingRedeemCount, setPendingRedeemCount] = useState(pendingRedeemCounts?.length || 0);
  const [liveRedeemCount, setLiveRedeemCount] = useState(liveRedeemCounts?.length || 0);
  const [completedRedeemCount, setCompletedRedeemCount] = useState(completedRedeemCounts?.length || 0);

  const [pendingTransferCount, setPendingTransferCount] = useState(pendingTransferCounts?.length || 0);
  const [completedTransferCount, setCompletedTransferCount] = useState(completedTransferCounts?.length || 0);

  const [pendingResetPasswordCount, setPendingResetPasswordCount] = useState(pendingResetPasswordCounts?.length || 0);
  const [completedResetPasswordCount, setCompletedResetPasswordCount] = useState(completedResetPasswordCounts?.length || 0);

  const [pendingNewAccountCount, setPendingNewAccountCount] = useState(pendingNewAccountCounts?.length || 0);
  const [completedNewAccountCount, setCompletedNewAccountCount] = useState(completedNewAccountCounts?.length || 0);

  // Update counts based on active tab and location
  useEffect(() => {
    if (activeTab === 'recharge') {
      if (location.pathname.includes('/recharge/pending')) {
        setPendingRechargeCount(pendingRechargeCounts?.length || 0);
      } else if (location.pathname.includes('/recharge/live')) {
        setLiveRechargeCount(liveRechargeCounts?.length || 0);
      } else if (location.pathname.includes('/recharge/completed')) {
        setCompletedRechargeCount(completedRechargeCounts?.length || 0);
      }
    } else if (activeTab === 'redeem') {
      if (location.pathname.includes('/redeem/pending')) {
        setPendingRedeemCount(pendingRedeemCounts?.length || 0);
      } else if (location.pathname.includes('/redeem/live')) {
        setLiveRedeemCount(liveRedeemCounts?.length || 0);
      } else if (location.pathname.includes('/redeem/completed')) {
        setCompletedRedeemCount(completedRedeemCounts?.length || 0);
      }
    } else if (activeTab === 'transfer') {
      if (location.pathname.includes('/transfer/pending')) {
        setPendingTransferCount(pendingTransferCounts?.length || 0);
      } else if (location.pathname.includes('/transfer/completed')) {
        setCompletedTransferCount(completedTransferCounts?.length || 0);
      }
    } else if (activeTab === 'resetpassword') {
      if (location.pathname.includes('/resetpassword/pending')) {
        setPendingResetPasswordCount(pendingResetPasswordCounts?.length || 0);
      } else if (location.pathname.includes('/resetpassword/completed')) {
        setCompletedResetPasswordCount(completedResetPasswordCounts?.length || 0);
      }
    } else if (activeTab === 'newaccount') {
      if (location.pathname.includes('/newaccount/pending')) {
        setPendingNewAccountCount(pendingNewAccountCounts?.length || 0);
      } else if (location.pathname.includes('/newaccount/completed')) {
        setCompletedNewAccountCount(completedNewAccountCounts?.length || 0);
      }
    }
  }, [activeTab, location.pathname, pendingRechargeCounts, liveRechargeCounts, completedRechargeCounts, pendingRedeemCounts, liveRedeemCounts, completedRedeemCounts, pendingTransferCounts, completedTransferCounts, pendingResetPasswordCounts, completedResetPasswordCounts, pendingNewAccountCounts, completedNewAccountCounts]);

  // Determine which counts to use based on active tab
  const getCountsForTab = () => {
    if (activeTab === 'recharge') {
      return {
        pending: pendingRechargeCount,
        live: liveRechargeCount,
        completed: completedRechargeCount
      };
    } else if (activeTab === 'redeem') {
      return {
        pending: pendingRedeemCount,
        live: liveRedeemCount,
        completed: completedRedeemCount
      };
    } else if (activeTab === 'transfer') {
      return {
        pending: pendingTransferCount,
        completed: completedTransferCount
      };
    } else if (activeTab === 'resetpassword') {
      return {
        pending: pendingResetPasswordCount,
        completed: completedResetPasswordCount
      };
    } else if (activeTab === 'newaccount') {
      return {
        pending: pendingNewAccountCount,
        completed: completedNewAccountCount
      };
    }
    return { pending: 0, live: 0, completed: 0 };
  };

  const counts = getCountsForTab();

  const statusOptions = [
    { label: "Pending", value: "pending", count: counts.pending, color: "bg-yellow-300" },
    { label: "Live", value: "live", count: counts.live, color: "bg-orange-300 text-gray-900" },
    { label: "Completed", value: "completed", count: counts.completed, color: "bg-green-300 " },
  ];

  return (
    <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
      <DynamicHeading className="text-2xl font-bold mb-6" title="User Activity" />

      {/* Action Buttons Section */}
      <div className="bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-700/50">
        <div className="flex flex-wrap gap-4 justify-center">

          <SupportSubmitRequest />
          <SubmitRedeemModal />

          <TransferRequestModal />

          <ResetPasswordModal /> 

          <NewAccountModal /> 
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-between bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700/50">
        <DynamicButtonGroup
          options={tabOptions}
          active={activeTab}
          onChange={onTabChange}
          className="mb-0"
        />

        <DynamicButtonGroup
          options={statusOptions}
          active={selectedStatus}
          onChange={(status) => {
            setSelectedStatus(status);
            setPageIndex(0); // Reset to first page on status change
            navigate(`/support/useractivity/${activeTab}/${status}`)
          }}
          className="mb-2"
        />
      </div>

      {/* Main Content */}
      <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-700/30">
        {children}
      </div>
    </div>
  );
};

export default UserActivityLayout;
