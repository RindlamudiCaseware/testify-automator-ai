
import React, { useState } from "react";
import { toast } from "sonner";
import Uploader from "@/components/uploader";
import { Textarea } from "@/components/ui/textarea";

interface Phase1Props {
  onComplete: () => void;
}

export default function Phase1DataIngestion({ onComplete }: Phase1Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [story, setStory] = useState("");
  const [url, setUrl] = useState("");
  const [inputMode, setInputMode] = useState<"files" | "story" | "url">("files");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const [capturedScreenshots, setCapturedScreenshots] = useState<string[]>([]);

  const handleFilesUploaded = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleStoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStory(e.target.value);
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

  const handleModeToggle = (mode: "files" | "story" | "url") => {
    setInputMode(mode);
  };

  const handleSubmit = async () => {
    if (inputMode === "files" && files.length === 0) {
      toast.error("Please upload at least one file to continue.");
      return;
    }

    if (inputMode === "story" && !story.trim()) {
      toast.error("Please enter a user story or requirement to continue.");
      return;
    }

    if (inputMode === "url") {
      if (!url) {
        toast.error("Please enter a URL to continue.");
        return;
      }
      if (!validateUrl(url)) {
        return;
      }
    }

    setIsLoading(true);
    
    // Mock progress simulation
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      
      // Add mockup screenshots for URL mode
      if (inputMode === "url" && currentProgress === 30) {
        setCapturedScreenshots(prev => [...prev, "Screenshot 1: Homepage"]);
      }
      if (inputMode === "url" && currentProgress === 60) {
        setCapturedScreenshots(prev => [...prev, "Screenshot 2: Login Form"]);
      }
      if (inputMode === "url" && currentProgress === 80) {
        setCapturedScreenshots(prev => [...prev, "Screenshot 3: Dashboard"]);
      }
      
      if (currentProgress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsLoading(false);
          if (inputMode === "files") {
            toast.success(`Successfully ingested ${files.length} files into ChromaDB`);
          } else if (inputMode === "story") {
            toast.success("Successfully processed your user story in ChromaDB");
          } else {
            toast.success(`Successfully captured web application at ${url}`);
          }
          onComplete();
        }, 500);
      }
      
      setProgress(currentProgress);
    }, 300);
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Data Ingestion</h2>
        <p className="text-muted-foreground">
          Provide test requirements through document uploads, user stories, or a web application URL.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button
          className={`px-4 py-2 rounded-md ${
            inputMode === "files"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary hover:bg-secondary/80"
          }`}
          onClick={() => handleModeToggle("files")}
        >
          Upload Files
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            inputMode === "story"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary hover:bg-secondary/80"
          }`}
          onClick={() => handleModeToggle("story")}
        >
          Enter User Story
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            inputMode === "url"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary hover:bg-secondary/80"
          }`}
          onClick={() => handleModeToggle("url")}
        >
          Enter URL
        </button>
      </div>

      <div className="p-6 border rounded-lg bg-card">
        {inputMode === "files" ? (
          <Uploader
            onFilesUploaded={handleFilesUploaded}
            title="Upload your test data"
            description="Drag & drop your files here or click to browse"
            maxFiles={20}
            maxSizeInMB={20}
          />
        ) : inputMode === "story" ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Enter user story or requirements</h3>
            <Textarea 
              value={story}
              onChange={handleStoryChange}
              placeholder="As a user, I want to be able to... so that I can..."
              className="min-h-[200px]"
            />
            <div className="text-muted-foreground text-sm">
              <p className="mb-2">Tips for writing effective user stories:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the format: "As a [role], I want [feature] so that [benefit]"</li>
                <li>Include acceptance criteria when possible</li>
                <li>Be specific about user interactions and expected outcomes</li>
                <li>Describe the business value of the feature</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Enter web application URL</h3>
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
                  className={`w-full px-4 py-2 border rounded-md bg-background ${
                    !isValid ? "border-destructive focus:ring-destructive" : ""
                  }`}
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
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {inputMode === "files" 
                  ? "Processing files..." 
                  : inputMode === "story" 
                    ? "Processing user story..." 
                    : "Scanning application..."}
              </span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {inputMode === "files" 
                ? "Analyzing and storing documents in ChromaDB..." 
                : inputMode === "story" 
                  ? "Processing and embedding user story in ChromaDB..." 
                  : "Capturing and analyzing web application..."}
            </p>
          </div>

          {inputMode === "url" && capturedScreenshots.length > 0 && (
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
          disabled={isLoading || 
            (inputMode === "files" && files.length === 0) || 
            (inputMode === "story" && !story.trim()) ||
            (inputMode === "url" && (!url || !isValid))}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
