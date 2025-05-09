// src/components/Phase3TestCaseGeneration.tsx

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { TestCase, TestStatus } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { fetchTestCases } from "@/api"; // ✅ ADD THIS IMPORT

interface Phase3Props {
  onComplete: () => void;
}

export default function Phase3TestCaseGeneration({ onComplete }: Phase3Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const generateTestCases = async () => {
    setIsGenerating(true);
    setProgress(0);
    setTestCases([]);

    try {
      let currentProgress = 0;
      const timer = setInterval(() => {
        currentProgress += 20;
        setProgress(currentProgress);

        if (currentProgress >= 80) {
          clearInterval(timer);
        }
      }, 300);

      const data = await fetchTestCases();
      console.log("Received test cases from backend:", data);
      setTestCases(data);

      setProgress(100);
      setTimeout(() => {
        setIsGenerating(false);
        toast.success(`Generated ${data.length} test cases from backend`);
      }, 500);
    } catch (error: any) {
      console.error("Error fetching test cases:", error);
      toast.error(`Error fetching test cases: ${error.response?.data?.detail || error.message}`);
      setIsGenerating(false);
    }
  }; // ✅ CLOSE function here!

  useEffect(() => {
    generateTestCases();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">AI-Based Test Case Generation</h2>
        <p className="text-muted-foreground">
          Our AI analyzes your ChromaDB data and generates comprehensive test cases.
        </p>
      </div>

      {isGenerating ? (
        <div className="p-6 border rounded-lg bg-card space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Generating test cases from backend...</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {progress < 40 && "Analyzing application structure..."}
              {progress >= 40 && progress < 70 && "Generating test scenarios..."}
              {progress >= 70 && "Finalizing test cases..."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Generated Test Cases</h3>
            <div className="flex space-x-2">
              <button
                onClick={generateTestCases}
                className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
              >
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v6h6"></path>
                    <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
                    <path d="M21 22v-6h-6"></path>
                    <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
                  </svg>
                  <span>Regenerate</span>
                </div>
              </button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {testCases.map((testCase) => (
                  <tr key={testCase.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {testCase.id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {testCase.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {testCase.description?.slice(0, 60)}
                      {testCase.description?.length > 60 ? "..." : ""}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <StatusBadge status={testCase.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-primary hover:text-primary/80 px-2">View</button>
                      <button className="text-primary hover:text-primary/80 px-2">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={isGenerating || testCases.length === 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
