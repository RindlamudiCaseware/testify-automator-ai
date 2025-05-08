
import React from "react";
import { cn } from "@/lib/utils";
import { TestStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: TestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusClasses = () => {
    switch (status) {
      case "passed":
        return "bg-success/20 text-success border-success/30";
      case "failed":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "skipped":
        return "bg-warning/20 text-warning/80 border-warning/30";
      case "pending":
        return "bg-info/20 text-info border-info/30";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getIcon = () => {
    switch (status) {
      case "passed":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        );
      case "failed":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        );
      case "skipped":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        );
      case "pending":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v10"/>
            <path d="M12 22v-2"/>
            <path d="m4.93 4.93 1.41 1.41"/>
            <path d="m17.66 17.66 1.41 1.41"/>
            <path d="M2 12h2"/>
            <path d="M20 12h2"/>
            <path d="m6.34 17.66-1.41 1.41"/>
            <path d="m19.07 4.93-1.41 1.41"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getStatusClasses(),
        className
      )}
    >
      <span className="mr-1">{getIcon()}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
