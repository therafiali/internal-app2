import React from "react";
import DynamicButtonGroup from "./DynamicButtonGroup";

export interface EntOption {
  label: string;
  value: string;
}

interface EntSelectorProps {
  options: EntOption[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

const EntSelector: React.FC<EntSelectorProps> = ({ options, active, onChange, className }) => {
  return (
    <DynamicButtonGroup
      options={options}
      active={active}
      onChange={onChange}
      className={className}
    />
  );
};

export default EntSelector; 