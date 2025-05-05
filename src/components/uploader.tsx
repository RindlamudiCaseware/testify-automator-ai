
import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface UploaderProps {
  onFilesUploaded: (files: File[]) => void;
  acceptedFileTypes?: string;
  maxFiles?: number;
  maxSizeInMB?: number;
  title?: string;
  description?: string;
}

export default function Uploader({
  onFilesUploaded,
  acceptedFileTypes = ".jpg,.jpeg,.png,.pdf,.docx,.xlsx,.txt",
  maxFiles = 10,
  maxSizeInMB = 10,
  title = "Upload your files",
  description = "Drag & drop your files here or click to browse",
}: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFiles = (filesToValidate: File[]): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    filesToValidate.forEach((file) => {
      // Check file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        newErrors.push(`"${file.name}" exceeds the maximum file size of ${maxSizeInMB}MB.`);
        return;
      }

      // Check file type if acceptedFileTypes is specified
      if (acceptedFileTypes !== "*") {
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const acceptedTypes = acceptedFileTypes.split(",");
        
        if (!acceptedTypes.includes(fileExtension) && !acceptedTypes.includes("*")) {
          newErrors.push(`"${file.name}" has an unsupported file type.`);
          return;
        }
      }

      validFiles.push(file);
    });

    // Check max number of files
    if (files.length + validFiles.length > maxFiles) {
      newErrors.push(`You can upload a maximum of ${maxFiles} files.`);
      return { valid: [], errors: newErrors };
    }

    return { valid: validFiles, errors: newErrors };
  };

  const processFiles = (filesToProcess: FileList | null) => {
    if (!filesToProcess || filesToProcess.length === 0) return;

    const fileArray = Array.from(filesToProcess);
    const { valid, errors: newErrors } = validateFiles(fileArray);

    if (valid.length > 0) {
      const updatedFiles = [...files, ...valid];
      setFiles(updatedFiles);
      onFilesUploaded(updatedFiles);
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    const updatedFiles = files.filter((file) => file !== fileToRemove);
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  const handleRemoveError = (errorToRemove: string) => {
    setErrors(errors.filter((error) => error !== errorToRemove));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    
    switch (extension) {
      case "pdf":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M9 15v-2"></path>
            <path d="M12 15v-6"></path>
            <path d="M15 15v-4"></path>
          </svg>
        );
      case "docx":
      case "doc":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      case "xlsx":
      case "xls":
      case "csv":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="8" y1="13" x2="16" y2="13"></line>
            <line x1="8" y1="17" x2="16" y2="17"></line>
          </svg>
        );
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={cn(
          "w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          files.length > 0 && "bg-secondary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          multiple
          accept={acceptedFileTypes}
        />
        <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Maximum {maxFiles} files, up to {maxSizeInMB}MB each
          </p>
        </div>
      </div>

      {/* Error list */}
      {errors.length > 0 && (
        <div className="mt-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-destructive mb-2">Upload Errors</h4>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-center justify-between text-xs text-destructive">
                  <span>{error}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveError(error);
                    }}
                    className="p-1 hover:bg-destructive/20 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Uploaded Files ({files.length}/{maxFiles})</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(file);
                  }}
                  className="p-1 hover:bg-primary/20 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
