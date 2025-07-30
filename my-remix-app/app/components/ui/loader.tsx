import React from "react";
import { Spinner } from "./spinner";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
  minHeight?: string;
}

export function Loader({ 
  size = "lg", 
  message = "Loading...", 
  className = "",
  minHeight = "min-h-[400px]"
}: LoaderProps) {
  return (
    <div className={`flex items-center justify-center ${minHeight} ${className}`}>
      <div className="text-center">
        <Spinner size={size} className="mb-4" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return <Loader message={message} />;
}

export function TableLoader({ message = "Loading data..." }: { message?: string }) {
  return <Loader message={message} minHeight="min-h-[300px]" />;
}

export function CardLoader({ message = "Loading..." }: { message?: string }) {
  return <Loader message={message} size="md" minHeight="min-h-[200px]" />;
} 