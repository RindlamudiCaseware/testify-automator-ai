
import React, { useState } from "react";
import { toast } from "sonner";
import Uploader from "@/components/uploader";

interface Phase1Props {
  onComplete: () => void;
}

export default function Phase1DataIngestion({ onComplete }: Phase1Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesUploaded = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file to continue.");
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
            toast.success(`Successfully ingested ${files.length} files into ChromaDB`);
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
          Upload your documents to train our AI. We support images, PDFs, Word documents, Excel files, and more.
        </p>
      </div>

      <div className="p-6 border rounded-lg bg-card">
        <Uploader
          onFilesUploaded={handleFilesUploaded}
          title="Upload your test data"
          description="Drag & drop your files here or click to browse"
          maxFiles={20}
          maxSizeInMB={20}
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Processing files...</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">
            Analyzing and storing documents in ChromaDB...
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isLoading || files.length === 0}
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
