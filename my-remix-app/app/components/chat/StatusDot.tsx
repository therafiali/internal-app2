import { cn } from "~/lib/utils";

interface StatusDotProps {
  status: "online" | "offline";
  className?: string;
}

export default function StatusDot({ status, className }: StatusDotProps) {
  return (
    <div
      className={cn(
        "w-3 h-3 rounded-full",
        status === "online" ? "bg-green-500" : "bg-red-500",
        className
      )}
    />
  );
} 