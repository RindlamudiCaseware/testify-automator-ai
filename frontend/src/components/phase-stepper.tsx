
import React from "react";
import { cn } from "@/lib/utils";
import { PHASES } from "@/lib/constants";

interface PhaseStepperProps {
  currentPhase: number;
  onPhaseClick: (phaseId: number) => void;
}

const PhaseIcon = ({ icon, active, completed }: { icon: string; active: boolean; completed: boolean }) => {
  const iconMap: Record<string, JSX.Element> = {
    upload: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    ),
    link: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
    ),
    sparkles: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
      </svg>
    ),
    database: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      </svg>
    ),
    code: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    ),
    files: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 2v4a2 2 0 0 0 2 2h4"></path>
        <path d="M22 6v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12"></path>
      </svg>
    ),
    play: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    ),
    "bar-chart": (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"></line>
        <line x1="18" y1="20" x2="18" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="16"></line>
      </svg>
    ),
    check: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ),
  };

  if (completed) {
    return (
      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
        {iconMap.check}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center text-white transition-colors",
        active ? "bg-primary" : "bg-secondary text-secondary-foreground"
      )}
    >
      {iconMap[icon]}
    </div>
  );
};

export function PhaseStepper({ currentPhase, onPhaseClick }: PhaseStepperProps) {
  return (
    <div className="w-full mb-8">
      <div className="hidden md:flex items-center justify-between">
        {PHASES.map((phase) => {
          const isActive = phase.id === currentPhase;
          const isCompleted = phase.id < currentPhase;
          
          return (
            <div 
              key={phase.id} 
              className={cn(
                "flex flex-col items-center space-y-2 cursor-pointer transition-opacity", 
                (isActive || isCompleted) ? "opacity-100" : "opacity-50"
              )}
              onClick={() => isCompleted && onPhaseClick(phase.id)}
            >
              <PhaseIcon 
                icon={phase.icon} 
                active={isActive} 
                completed={isCompleted} 
              />
              <span className={cn(
                "text-xs font-medium", 
                isActive ? "text-primary" : "text-secondary-foreground"
              )}>
                {phase.title}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Mobile view - show only current phase and navigation buttons */}
      <div className="flex md:hidden items-center justify-between px-4">
        <button 
          className="p-2 rounded-full bg-secondary"
          onClick={() => currentPhase > 1 && onPhaseClick(currentPhase - 1)}
          disabled={currentPhase <= 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        
        <div className="flex flex-col items-center">
          <PhaseIcon 
            icon={PHASES[currentPhase - 1].icon} 
            active={true} 
            completed={false} 
          />
          <span className="text-sm font-medium mt-2">{PHASES[currentPhase - 1].title}</span>
          <span className="text-xs text-secondary-foreground">{currentPhase} of {PHASES.length}</span>
        </div>
        
        <button 
          className="p-2 rounded-full bg-secondary"
          onClick={() => currentPhase < PHASES.length && onPhaseClick(currentPhase + 1)}
          disabled={currentPhase >= PHASES.length}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
