
import React from "react";
import { File } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileIconProps {
  name: string;
  type?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function FileIcon({ 
  name, 
  type = "default", 
  size = "md", 
  className,
  onClick
}: FileIconProps) {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const typeColors = {
    default: "text-neutral-600",
    data: "text-primary",
    image: "text-blue-500",
    document: "text-orange-500",
    code: "text-green-500",
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-2 p-3 cursor-pointer hover:bg-secondary/50 rounded-md transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        <File 
          className={cn(
            sizes[size], 
            typeColors[type as keyof typeof typeColors] || typeColors.default
          )} 
        />
      </div>
      <span className="text-sm font-medium text-center max-w-[120px] truncate">
        {name}
      </span>
    </div>
  );
}
