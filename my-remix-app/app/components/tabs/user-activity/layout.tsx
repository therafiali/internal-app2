import React from "react";
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";
import DynamicHeading from "~/components/shared/DynamicHeading";

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

const UserActivityLayout: React.FC<UserActivityLayoutProps> = ({
  activeTab,
  onTabChange,
  tabOptions,
  children,
}) => {
  return (
    <div className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen p-8">
      <DynamicHeading className="text-2xl font-bold" title="User Activity" />
      <DynamicButtonGroup
        options={tabOptions}
        active={activeTab}
        onChange={onTabChange}
        className="mb-8"
      />
      {children}
    </div>
  );
};

export default UserActivityLayout;
