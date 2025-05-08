
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface AssistantTipsProps {
  tips: {
    title: string;
    content: string;
  }[];
}

export default function AssistantTips({ tips }: AssistantTipsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 bg-card border border-border rounded-lg shadow-md transition-all duration-300 z-10 overflow-hidden",
        isOpen ? "w-80 max-w-[90vw]" : "w-12 h-12"
      )}
    >
      {isOpen ? (
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9"/>
                <path d="M2 17.5C2 15 7 15 7 17.5v1.5a2 2 0 0 0 2 2h.5"/>
                <path d="M22 17.5c0-2.5-5-2.5-5 0v1.5a2 2 0 0 1-2 2h-.5"/>
                <path d="M7 15h10"/>
                <path d="M16 6H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Z"/>
              </svg>
              <span className="font-medium">AI Assistant</span>
            </div>
            <button onClick={toggleOpen} className="text-primary-foreground hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium mb-2">{tips[currentTipIndex].title}</h3>
            <p className="text-xs text-secondary-foreground mb-4">{tips[currentTipIndex].content}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Tip {currentTipIndex + 1} of {tips.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={prevTip}
                  className="p-1 rounded-full hover:bg-accent transition-colors"
                  aria-label="Previous tip"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
                <button
                  onClick={nextTip}
                  className="p-1 rounded-full hover:bg-accent transition-colors"
                  aria-label="Next tip"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={toggleOpen}
          className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9"/>
            <path d="M2 17.5C2 15 7 15 7 17.5v1.5a2 2 0 0 0 2 2h.5"/>
            <path d="M22 17.5c0-2.5-5-2.5-5 0v1.5a2 2 0 0 1-2 2h-.5"/>
            <path d="M7 15h10"/>
            <path d="M16 6H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Z"/>
          </svg>
        </button>
      )}
    </div>
  );
}
