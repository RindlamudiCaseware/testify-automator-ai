
import React, { useState } from "react";
import { toast } from "sonner";
import { TestCase, TestStatus } from "@/lib/types";
import { MOCK_TEST_CASES } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";

interface Phase6Props {
  onComplete: () => void;
}

export default function Phase6BulkCodeGeneration({ onComplete }: Phase6Props) {
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gitOptions, setGitOptions] = useState({
    pushToGit: false,
    gitRepo: "",
    gitBranch: "main"
  });
  const [generatedResults, setGeneratedResults] = useState<
    {
      id: string;
      title: string;
      status: "completed" | "failed" | "pending";
    }[]
  >([]);

  const handleCheckboxChange = (id: string) => {
    setSelectedTestCases(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTestCases.length === MOCK_TEST_CASES.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(MOCK_TEST_CASES.map(tc => tc.id));
    }
  };

  const handleGitOptionChange = (field: keyof typeof gitOptions, value: any) => {
    setGitOptions(prev => ({
      ...prev,
      [field]: field === "pushToGit" ? !prev.pushToGit : value
    }));
  };

  const generateCode = () => {
    if (selectedTestCases.length === 0) {
      toast.error("Please select at least one test case");
      return;
    }

    if (gitOptions.pushToGit && !gitOptions.gitRepo) {
      toast.error("Please enter a Git repository URL");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedResults([]);
    
    // Mock code generation with progress updates
    let currentProgress = 0;
    const increment = 100 / selectedTestCases.length;
    
    const timer = setInterval(() => {
      const testCaseIndex = Math.floor(currentProgress / increment);
      
      if (testCaseIndex < selectedTestCases.length) {
        const testCase = MOCK_TEST_CASES.find(tc => tc.id === selectedTestCases[testCaseIndex]);
        
        if (testCase) {
          // Randomly succeed or fail some test case generations
          const status = Math.random() > 0.2 ? "completed" : "failed";
          
          setGeneratedResults(prev => [
            ...prev, 
            { 
              id: testCase.id, 
              title: testCase.title, 
              status: status as "completed" | "failed" | "pending"
            }
          ]);
        }
      }
      
      currentProgress += increment;
      setProgress(Math.min(Math.round(currentProgress), 100));
      
      if (currentProgress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsGenerating(false);
          const successCount = generatedResults.filter(r => r.status === "completed").length;
          toast.success(`Generated code for ${successCount} out of ${selectedTestCases.length} test cases`);
          
          if (gitOptions.pushToGit) {
            toast.success(`Code pushed to ${gitOptions.gitRepo} on branch ${gitOptions.gitBranch}`);
          } else {
            toast.success("Code saved to database");
          }
        }, 500);
      }
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Bulk Code Generation</h2>
        <p className="text-muted-foreground">
          Generate Playwright test code for multiple test cases simultaneously.
        </p>
      </div>

      <div className="p-4 border rounded-lg space-y-4">
        <h3 className="font-medium">Git Repository Options</h3>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="push-to-git"
            checked={gitOptions.pushToGit}
            onChange={() => handleGitOptionChange("pushToGit", undefined)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="push-to-git" className="text-sm">
            Push generated code to Git repository
          </label>
        </div>
        
        {gitOptions.pushToGit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="git-repo" className="text-sm font-medium">
                Git Repository URL
              </label>
              <input
                id="git-repo"
                type="text"
                placeholder="https://github.com/username/repo.git"
                value={gitOptions.gitRepo}
                onChange={(e) => handleGitOptionChange("gitRepo", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="git-branch" className="text-sm font-medium">
                Branch
              </label>
              <input
                id="git-branch"
                type="text"
                placeholder="main"
                value={gitOptions.gitBranch}
                onChange={(e) => handleGitOptionChange("gitBranch", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center space-x-2">
            <span>Select Test Cases for Code Generation</span>
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              {selectedTestCases.length} selected
            </span>
          </h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm flex items-center space-x-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedTestCases.length === MOCK_TEST_CASES.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Select All</span>
            </label>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-10">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Generation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_TEST_CASES.map((testCase) => {
                const generatedResult = generatedResults.find(r => r.id === testCase.id);
                return (
                  <tr key={testCase.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={selectedTestCases.includes(testCase.id)}
                        onChange={() => handleCheckboxChange(testCase.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        disabled={isGenerating}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {testCase.id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {testCase.title}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <StatusBadge status={testCase.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm hidden sm:table-cell">
                      {isGenerating && selectedTestCases.includes(testCase.id) && !generatedResult && (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Pending...</span>
                        </div>
                      )}
                      {generatedResult && (
                        <span className={
                          generatedResult.status === "completed" 
                            ? "text-success" 
                            : generatedResult.status === "failed" 
                              ? "text-destructive" 
                              : "text-warning"
                        }>
                          {generatedResult.status === "completed" 
                            ? "✓ Generated" 
                            : generatedResult.status === "failed" 
                              ? "✕ Failed" 
                              : "⟳ Pending"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isGenerating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Generating code...</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          onClick={generateCode}
          disabled={isGenerating || selectedTestCases.length === 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </div>
          ) : (
            "Generate Code"
          )}
        </button>
        
        <button
          onClick={onComplete}
          disabled={isGenerating}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatedResults.length > 0 ? "Continue" : "Skip"}
        </button>
      </div>
    </div>
  );
}
