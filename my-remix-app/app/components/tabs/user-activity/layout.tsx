import React, { useState, useEffect } from "react";
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";
import DynamicHeading from "~/components/shared/DynamicHeading";

import SupportSubmitRequest from "~/components/submitrequest";
import { SubmitRedeemModal } from "~/components/SubmitRedeemModal";
import { useLocation, useNavigate } from "@remix-run/react";
import { useFetchCounts } from "~/hooks/api/queries/useFetchCounts";
import TransferRequestModal from "~/components/transferrequest";
import ResetPasswordModal from "~/components/resetpassword";
import { useAuth } from "~/hooks/use-auth";
import { useFetchAgentEnt } from "~/hooks/api/queries/useFetchAgentEnt";
import EntSelector from "~/components/shared/EntSelector";
import { TeamProvider, useTeam } from "./TeamContext";
import NewAccountModal from "~/components/NewAccountRequestModal";

interface TabOption {
  label: string;
  value: string;
}

interface UserActivityLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabOptions: TabOption[];
  children: React.ReactNode;
  // Remove selectedTeam and onTeamChange props
}

const UserActivityLayout: React.FC<UserActivityLayoutProps> = ({
  activeTab,
  onTabChange,
  tabOptions,
  children,
  // Remove selectedTeam and onTeamChange props
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const urlStatus = location.pathname.split("/").pop() || "pending";
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

  const { user } = useAuth();
  const { data: agentEnt } = useFetchAgentEnt(user?.id || "");
  console.log(agentEnt, "agentEnt from layout");
  const { selectedTeam, setSelectedTeam } = useTeam();

  const { data: pendingRechargeCounts } = useFetchCounts("recharge_requests", [
    "0",
    "1",
    "2",
    "3",
  ], selectedTeam == "ALL" ? agentEnt : [selectedTeam]);
  const { data: completedRechargeCounts } = useFetchCounts(
    "recharge_requests",
    ["4"],
    selectedTeam == "ALL" ? agentEnt : [selectedTeam]
    );

  const { data: pendingRedeemCounts } = useFetchCounts("redeem_requests", [
    "0",
    "1",
    "2",
    "3",
    "4",
  ], selectedTeam == "ALL" ? agentEnt : [selectedTeam]);
  const { data: completedRedeemCounts } = useFetchCounts("redeem_requests", [
    "5",
  ], selectedTeam == "ALL" ? agentEnt : [selectedTeam]);

  const { data: pendingTransferCounts } = useFetchCounts("transfer_requests", [
    "0",
  ], selectedTeam == "ALL" ? agentEnt : [selectedTeam]);
  const { data: completedTransferCounts } = useFetchCounts(
    "transfer_requests",
    ["3"],
    selectedTeam == "ALL" ? agentEnt : [selectedTeam]
  );

  const { data: pendingResetPasswordCounts } = useFetchCounts(
    "reset_password_requests",
    ["0"],
    selectedTeam == "ALL" ? agentEnt : [selectedTeam]
  );
  const { data: completedResetPasswordCounts } = useFetchCounts(
    "reset_password_requests",
    ["3"],
    selectedTeam == "ALL" ? agentEnt : [selectedTeam]
  );

  const { data: pendingNewAccountCounts } = useFetchCounts(
    "new_account_requests",
    ["0"],
    selectedTeam == "ALL" ? agentEnt : [selectedTeam]
  );
  const { data: completedNewAccountCounts } = useFetchCounts(
    "new_account_requests",
    ["3"],
    selectedTeam == "ALL" ? agentEnt : [selectedTeam]
  );

  const [pendingRechargeCount, setPendingRechargeCount] = useState(
    pendingRechargeCounts?.length || 0
  );
  const [completedRechargeCount, setCompletedRechargeCount] = useState(
    completedRechargeCounts?.length || 0
  );

  const [pendingRedeemCount, setPendingRedeemCount] = useState(
    pendingRedeemCounts?.length || 0
  );
  const [completedRedeemCount, setCompletedRedeemCount] = useState(
    completedRedeemCounts?.length || 0
  );

  const [pendingTransferCount, setPendingTransferCount] = useState(
    pendingTransferCounts?.length || 0
  );
  const [completedTransferCount, setCompletedTransferCount] = useState(
    completedTransferCounts?.length || 0
  );

  const [pendingResetPasswordCount, setPendingResetPasswordCount] = useState(
    pendingResetPasswordCounts?.length || 0
  );
  const [completedResetPasswordCount, setCompletedResetPasswordCount] =
    useState(completedResetPasswordCounts?.length || 0);

  const [pendingNewAccountCount, setPendingNewAccountCount] = useState(
    pendingNewAccountCounts?.length || 0
  );
  const [completedNewAccountCount, setCompletedNewAccountCount] = useState(
    completedNewAccountCounts?.length || 0
  );

  // Update counts based on active tab and location
  useEffect(() => {
    if (activeTab === "recharge") {
      if (location.pathname.includes("/recharge/pending")) {
        setPendingRechargeCount(pendingRechargeCounts?.length  || 0);
      } else if (location.pathname.includes("/recharge/completed")) {
        setCompletedRechargeCount(completedRechargeCounts?.length || 0);
      }
    } else if (activeTab === "redeem") {
      if (location.pathname.includes("/redeem/pending")) {
        setPendingRedeemCount(pendingRedeemCounts?.length || 0);
      } else if (location.pathname.includes("/redeem/completed")) {
        setCompletedRedeemCount(completedRedeemCounts?.length || 0);
      }
    } else if (activeTab === "transfer") {
      if (location.pathname.includes("/transfer/pending")) {
        setPendingTransferCount(pendingTransferCounts?.length || 0);
      } else if (location.pathname.includes("/transfer/completed")) {
        setCompletedTransferCount(completedTransferCounts?.length || 0);
      }
    } else if (activeTab === "resetpassword") {
      if (location.pathname.includes("/resetpassword/pending")) {
        setPendingResetPasswordCount(pendingResetPasswordCounts?.length || 0);
      } else if (location.pathname.includes("/resetpassword/completed")) {
        setCompletedResetPasswordCount(
          completedResetPasswordCounts?.length || 0
        );
      }
    } else if (activeTab === "newaccount") {
      if (location.pathname.includes("/newaccount/pending")) {
        setPendingNewAccountCount(pendingNewAccountCounts?.length || 0);
      } else if (location.pathname.includes("/newaccount/completed")) {
        setCompletedNewAccountCount(completedNewAccountCounts?.length || 0);
      }
    }
  }, [
    activeTab,
    location.pathname,
    pendingRechargeCounts,
    completedRechargeCounts,
    pendingRedeemCounts,
    completedRedeemCounts,
    pendingTransferCounts,
    completedTransferCounts,
    pendingResetPasswordCounts,
    completedResetPasswordCounts,
    pendingNewAccountCounts,
    completedNewAccountCounts,
  ]);

  // Determine which counts to use based on active tab
  const getCountsForTab = () => {
    if (activeTab === "recharge") {
      return {
        pending: pendingRechargeCount,
        completed: completedRechargeCount,
      };
    } else if (activeTab === "redeem") {
      return {
        pending: pendingRedeemCount,
        completed: completedRedeemCount,
      };
    } else if (activeTab === "transfer") {
      return {
        pending: pendingTransferCount,
        completed: completedTransferCount,
      };
    } else if (activeTab === "resetpassword") {
      return {
        pending: pendingResetPasswordCount,
        completed: completedResetPasswordCount,
      };
    } else if (activeTab === "newaccount") {
      return {
        pending: pendingNewAccountCount,
        completed: completedNewAccountCount,
      };
    }
    return { pending: 0, live: 0, completed: 0 };
  };

  const counts = getCountsForTab();

  // Create status options based on active tab
  const getStatusOptions = () => {
    if (activeTab === 'newaccount' || activeTab === 'transfer' || activeTab === 'resetpassword' || activeTab === 'recharge' || activeTab === 'redeem') {
      // Only show Pending and Completed for New Account, Transfer, Reset Password, Recharge, and Redeem
      return [
        { label: "Pending", value: "pending", count: counts.pending, color: "bg-yellow-300" },
        { label: "Completed", value: "completed", count: counts.completed, color: "bg-green-300 " },
      ];
    } else {
      // No other tabs currently
      return [
        { label: "Pending", value: "pending", count: counts.pending, color: "bg-yellow-300" },
        { label: "Completed", value: "completed", count: counts.completed, color: "bg-green-300 " },
      ];
    }
  };

  const statusOptions = getStatusOptions();

  // Team selection logic

  const teamsFromEnts = agentEnt || [];
  // sort teams from ent alphabetically ENT1 , ENT2 , ENT3 , ENT4 , ENT5 , ENT6 , ENT7 , ENT8 , ENT9 , ENT10
  const teams = ["ALL", ...teamsFromEnts.sort((a, b) => a.localeCompare(b))];

  // Use context for selectedTeam


  // Debug logs
  console.log("[UserActivityLayout] selectedTeam state:", selectedTeam);
  console.log("[UserActivityLayout] currentSelectedTeam:", selectedTeam);

  return (
    <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
      <DynamicHeading
        className="text-2xl font-bold mb-6"
        title="User Activity"
      />
      {/* Action Buttons Section */}
      <div className="bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-700/50">
        <div className="flex flex-wrap gap-4 justify-center">
          <SupportSubmitRequest />
          <SubmitRedeemModal 
            open={isRedeemModalOpen}
            onOpenChange={setIsRedeemModalOpen}
          />
          <TransferRequestModal />
          <ResetPasswordModal />
          <NewAccountModal 
            open={isNewAccountModalOpen}
            onOpenChange={setIsNewAccountModalOpen}
            onSubmit={(data) => {
              console.log("New account request submitted:", data);
              setIsNewAccountModalOpen(false);
            }}
          />
        </div>
      </div>
      {/* Team Tabs Bar */}
      <EntSelector
        options={teams.map((team) => ({ label: team, value: team }))}
        active={selectedTeam}
        onChange={setSelectedTeam}
        className="mb-4"
      />
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
            navigate(`/support/useractivity/${activeTab}/${status}`);
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
