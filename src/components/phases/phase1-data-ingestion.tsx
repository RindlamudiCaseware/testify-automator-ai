
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
  const [inputMode, setInputMode] = useState<"files" | "story">("files");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesUploaded = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleStoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStory(e.target.value);
  };

  const handleModeToggle = (mode: "files" | "story") => {
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

    setIsLoading(true);
    
    // Mock progress simulation
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 10;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsLoading(false);
            if (inputMode === "files") {
              toast.success(`Successfully ingested ${files.length} files into ChromaDB`);
            } else {
              toast.success("Successfully processed your user story in ChromaDB");
            }
            onComplete();
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Data Ingestion</h2>
        <p className="text-muted-foreground">
          Provide test requirements either by uploading documents or writing a user story.
        </p>
      </div>

      <div className="flex space-x-2 border-b pb-2">
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
        ) : (
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
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Processing data...</span>
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
              : "Processing and embedding user story in ChromaDB..."}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isLoading || (inputMode === "files" && files.length === 0) || (inputMode === "story" && !story.trim())}
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
