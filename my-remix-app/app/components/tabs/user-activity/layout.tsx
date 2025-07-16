import React from "react";
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";
import DynamicHeading from "~/components/shared/DynamicHeading";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";

import SupportSubmitRequest from "~/components/submitrequest";
import { SubmitRedeemModal } from "~/components/SubmitRedeemModal";

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
  return (
    <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
      <DynamicHeading className="text-2xl font-bold mb-6" title="User Activity" />
      
      {/* Action Buttons Section */}
      <div className="bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-700/50">
        <div className="flex flex-wrap gap-4 justify-center">
          
          <SupportSubmitRequest />  
          <SubmitRedeemModal />  
       

          <DynamicActionButton
            title="TRANSFER REQUEST"
            iconColor="text-orange-400"
            borderColor="border-orange-500/30"
          >
           
          </DynamicActionButton>

          <DynamicActionButton
            title="RESET PASSWORD"
            iconColor="text-purple-400"
            borderColor="border-purple-500/30"
          >
           
          </DynamicActionButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700/50">
        <DynamicButtonGroup
          options={tabOptions}
          active={activeTab}
          onChange={onTabChange}
          className="mb-0"
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
