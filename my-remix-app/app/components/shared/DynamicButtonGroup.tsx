import React from "react";

interface ButtonOption {
  label: string;
  value: string;
}

interface DynamicButtonGroupProps {
  options: ButtonOption[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

const DynamicButtonGroup: React.FC<DynamicButtonGroupProps> = ({
  options,
  active,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={`flex gap-2 bg-[hsl(var(--sidebar-background))] rounded-lg p-2 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--sidebar-foreground))]  ${
            active === option.value
              ? "bg-white text-black shadow"
              : "bg-transparent text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-foreground)/0.1)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default DynamicButtonGroup; 