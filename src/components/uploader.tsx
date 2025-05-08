
import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Images, MoveHorizontal } from "lucide-react";
import { CircleDot } from "lucide-react";

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
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviews, setImagePreviews] = useState<{[key: string]: string}>({});

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

  const generateImagePreview = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviews(prev => ({
        ...prev,
        [file.name]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const processFiles = (filesToProcess: FileList | null) => {
    if (!filesToProcess || filesToProcess.length === 0) return;

    const fileArray = Array.from(filesToProcess);
    const { valid, errors: newErrors } = validateFiles(fileArray);

    if (valid.length > 0) {
      // Generate previews for images
      valid.forEach(file => {
        generateImagePreview(file);
      });
      
      const updatedFiles = [...files, ...valid];
      setFiles(updatedFiles);
      onFilesUploaded(updatedFiles);
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      newErrors.forEach(error => toast.error(error));
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
    
    // Remove image preview if exists
    if (imagePreviews[fileToRemove.name]) {
      const updatedPreviews = {...imagePreviews};
      delete updatedPreviews[fileToRemove.name];
      setImagePreviews(updatedPreviews);
    }
  };

  const handleRemoveError = (errorToRemove: string) => {
    setErrors(errors.filter((error) => error !== errorToRemove));
  };

  // Functions for drag and drop reordering
  const handleItemDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleItemDragEnd = () => {
    setDraggedItem(null);
    setDropTargetIndex(null);
  };

  const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedItem === null) return;
    if (draggedItem !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleItemDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedItem === null) return;
    
    const updatedFiles = [...files];
    const [draggedFile] = updatedFiles.splice(draggedItem, 1);
    updatedFiles.splice(index, 0, draggedFile);
    
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
    setDraggedItem(null);
    setDropTargetIndex(null);
    toast.success("File order updated successfully");
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
          <Images size={40} className="text-primary" />
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

      {/* File list with drag and drop capability - updated for 3 images in a row */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Uploaded Files ({files.length}/{maxFiles})</h4>
            {files.length > 1 && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MoveHorizontal size={14} className="mr-1" />
                <span>Drag files to reorder</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleItemDragStart(index)}
                onDragEnd={handleItemDragEnd}
                onDragOver={(e) => handleItemDragOver(e, index)}
                onDrop={(e) => handleItemDrop(e, index)}
                className={cn(
                  "flex flex-col relative p-2 bg-secondary rounded-lg cursor-move border-2 transition-colors",
                  draggedItem === index && "opacity-50",
                  dropTargetIndex === index && "border-primary bg-primary/5",
                  draggedItem !== index && dropTargetIndex !== index && "border-transparent"
                )}
              >
                {/* Number indicator */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium z-10">
                  {index + 1}
                </div>
                
                <div className="flex flex-col items-center space-y-2 w-full">
                  {file.type.startsWith('image/') && imagePreviews[file.name] ? (
                    <div className="w-full h-40 rounded-md overflow-hidden flex-shrink-0 mb-2">
                      <img 
                        src={imagePreviews[file.name]} 
                        alt={file.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 rounded-md overflow-hidden flex-shrink-0 bg-secondary-foreground/5 flex items-center justify-center mb-2">
                      {getFileIcon(file.name)}
                    </div>
                  )}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate max-w-[180px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file);
                      }}
                      className="p-1 hover:bg-primary/20 rounded-full ml-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
