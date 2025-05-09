// src/components/Phase1DataIngestion.tsx

import React, { useState } from "react";
import { toast } from "sonner";
import Uploader from "@/components/uploader";
import { Textarea } from "@/components/ui/textarea";
import { chromaClient } from "@/lib/chroma-client";
import { uploadImage, submitUrl } from "@/api"; // ✅ link to axios API

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
      toast.error("Please enter a user story to continue.");
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
    setProgress(0);

    try {
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress >= 90) clearInterval(progressInterval);
        setProgress(currentProgress);
      }, 200);

      if (inputMode === "files") {
        for (const file of files) {
          try {
            const result = await uploadImage(file); // ✅ send file to backend
            toast.success(`Uploaded ${file.name}`);
            console.log("Upload response:", result);
          } catch (error: any) {
            toast.error(`Upload failed for ${file.name}: ${error}`);
          }
        }
      } else if (inputMode === "url") {
        try {
          const result = await submitUrl(url); // ✅ send URL to backend
          toast.success(`Submitted URL: ${url}`);
          console.log("URL submission response:", result);
        } catch (error: any) {
          toast.error(`Failed to submit URL: ${error}`);
        }
      } else if (inputMode === "story") {
        try {
          await chromaClient.createCollection("test_automation").catch(() => {});
          await chromaClient.addDocuments("test_automation", [story], [
            { type: "user_story", createdAt: new Date().toISOString() },
          ]);
          toast.success("User story saved.");
        } catch (error) {
          toast.error("Error saving user story.");
        }
      }

      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        onComplete();
      }, 500);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Error during submission.");
      setIsLoading(false);
    }
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
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Enter web application URL</h3>
            <div className="space-y-2">
              <label htmlFor="url-input" className="text-sm font-medium">
                Web Application URL
              </label>
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
              {!isValid && <p className="text-xs text-destructive">{validationMessage}</p>}
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
                  ? "Uploading files..."
                  : inputMode === "story"
                  ? "Saving user story..."
                  : "Submitting URL..."}
              </span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={
            isLoading ||
            (inputMode === "files" && files.length === 0) ||
            (inputMode === "story" && !story.trim()) ||
            (inputMode === "url" && (!url || !isValid))
          }
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
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
