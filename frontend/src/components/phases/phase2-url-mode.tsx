
import React, { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Phase2Props {
  onComplete: () => void;
}

export default function Phase2UrlMode({ onComplete }: Phase2Props) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [capturedScreenshots, setCapturedScreenshots] = useState<string[]>([]);

  const validateUrl = (input: string) => {
    try {
      new URL(input);
      setIsValid(true);
      setValidationMessage("");
      return true;
    } catch (e) {
      setIsValid(false);
      setValidationMessage("Please enter a valid URL (e.g., https://example.com)");
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    
    if (input) {
      validateUrl(input);
    } else {
      setIsValid(true);
      setValidationMessage("");
    }
  };

  const handleSubmit = async () => {
    if (!url) {
      toast.error("Please enter a URL to continue.");
      return;
    }

    if (!validateUrl(url)) {
      return;
    }

    setIsLoading(true);
    
    // Mock progress and screenshots capture
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      
      // Add mockup screenshots at specific points
      if (currentProgress === 30) {
        setCapturedScreenshots(prev => [...prev, "Screenshot 1: Homepage"]);
      }
      if (currentProgress === 60) {
        setCapturedScreenshots(prev => [...prev, "Screenshot 2: Login Form"]);
      }
      if (currentProgress === 80) {
        setCapturedScreenshots(prev => [...prev, "Screenshot 3: Dashboard"]);
      }
      
      if (currentProgress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsLoading(false);
          toast.success(`Successfully captured web application at ${url}`);
          onComplete();
        }, 500);
      }
    }, 300);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">URL Mode</h2>
        <p className="text-muted-foreground">
          Enter the URL of your web application to automatically scan and analyze it for test case generation.
        </p>
      </div>

      <div className="p-6 border rounded-lg bg-card">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url-input" className="text-sm font-medium">
              Web Application URL
            </label>
            <div className="relative">
              <input
                id="url-input"
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                className={cn(
                  "w-full px-4 py-2 border rounded-md bg-background",
                  !isValid && "border-destructive focus:ring-destructive"
                )}
                disabled={isLoading}
              />
              {url && isValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
              )}
            </div>
            {!isValid && (
              <p className="text-xs text-destructive">{validationMessage}</p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Options</h3>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="capture-screenshots"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  defaultChecked
                  disabled={isLoading}
                />
                <label htmlFor="capture-screenshots" className="text-sm">
                  Capture screenshots
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="extract-dom"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  defaultChecked
                  disabled={isLoading}
                />
                <label htmlFor="extract-dom" className="text-sm">
                  Extract DOM structure
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="discover-routes"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  defaultChecked
                  disabled={isLoading}
                />
                <label htmlFor="discover-routes" className="text-sm">
                  Discover routes
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Scanning application...</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {capturedScreenshots.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Captured Content</h3>
              <div className="space-y-2">
                {capturedScreenshots.map((screenshot, index) => (
                  <div key={index} className="p-2 bg-secondary rounded flex items-center space-x-2 animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span className="text-xs">{screenshot}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isLoading || !url || !isValid}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning...
            </div>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
