// src/components/Phase4TestCaseStorage.tsx

import React, { useState } from "react";
import { toast } from "sonner";
import { TestCase } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { exportToExcel, pushToJira } from "@/api"; // ✅ backend API calls

interface Phase4Props {
  onComplete: () => void;
  testCases: TestCase[];
}

export default function Phase4TestCaseStorage({ onComplete, testCases }: Phase4Props) {
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [storageOption, setStorageOption] = useState<"excel" | "jira">("excel");
  const [jiraDetails, setJiraDetails] = useState({
    url: "",
    apiKey: "",
    projectKey: "",
    issueType: "Test"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mappingFields, setMappingFields] = useState(false);

  const handleCheckboxChange = (id: string) => {
    setSelectedTestCases((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTestCases.length === testCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(testCases.map((tc) => tc.id));
    }
  };

  const handleStorageOptionChange = (option: "excel" | "jira") => {
    setStorageOption(option);
  };

  const handleJiraDetailsChange = (field: keyof typeof jiraDetails, value: string) => {
    setJiraDetails((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (selectedTestCases.length === 0) {
      toast.error("Please select at least one test case");
      return;
    }

    if (
      storageOption === "jira" &&
      (!jiraDetails.url || !jiraDetails.apiKey || !jiraDetails.projectKey)
    ) {
      toast.error("Please fill in all JIRA fields");
      return;
    }

    const selected = testCases.filter((tc) => selectedTestCases.includes(tc.id));
    setIsLoading(true);

    try {
      if (storageOption === "excel") {
        await exportToExcel(selected); // ✅ backend call
        toast.success(`Exported ${selected.length} test cases to Excel`);
      } else {
        await pushToJira(selected, jiraDetails); // ✅ backend call
        toast.success(`Pushed ${selected.length} test cases to JIRA project ${jiraDetails.projectKey}`);
      }
      onComplete();
    } catch (error: any) {
      console.error("Storage error:", error);
      toast.error(`Storage failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMappingFields = () => {
    setMappingFields((prev) => !prev);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Test Case Storage</h2>
        <p className="text-muted-foreground">
          Store your test cases in Excel or push them to JIRA.
        </p>
      </div>

      {/* Storage Option Buttons */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => handleStorageOptionChange("excel")}
          className={`flex-1 p-4 rounded-lg border ${
            storageOption === "excel" ? "border-primary bg-primary/5" : "border-border"
          } transition-colors`}
        >
          <div className="flex items-center space-x-3">
            <svg className="text-green-600" viewBox="0 0 24 24" width="24" height="24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="8" y1="13" x2="16" y2="13"></line>
              <line x1="8" y1="17" x2="16" y2="17"></line>
            </svg>
            <div>
              <h3 className="font-medium">Export to Excel</h3>
              <p className="text-xs text-muted-foreground">Save test cases as .xlsx file</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => handleStorageOptionChange("jira")}
          className={`flex-1 p-4 rounded-lg border ${
            storageOption === "jira" ? "border-primary bg-primary/5" : "border-border"
          } transition-colors`}
        >
          <div className="flex items-center space-x-3">
            <svg className="text-blue-500" viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.2 0 2.5 1 3.4.8.8 2.1 1.2 3.3 1 .6 1 1.8 1.6 3 1.6s2.4-.6 3-1.7c1.2.3 2.5 0 3.4-1 .8-.8 1.2-2 1-3.3 1-.6 1.6-1.8 1.6-3s-.6-2.4-1.7-3c.3-1.2 0-2.5-1-3.4a3.7 3.7 0 0 0-3.3-1c-.6-1-1.8-1.6-3-1.6z"></path>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <div>
              <h3 className="font-medium">Push to JIRA</h3>
              <p className="text-xs text-muted-foreground">Create issues in your JIRA project</p>
            </div>
          </div>
        </button>
      </div>

      {/* JIRA Config */}
      {storageOption === "jira" && (
        <div className="p-4 border rounded-lg space-y-4">
          <h3 className="font-medium">JIRA Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">JIRA URL</label>
              <input
                type="text"
                value={jiraDetails.url}
                onChange={(e) => handleJiraDetailsChange("url", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://your-domain.atlassian.net"
              />
            </div>
            <div>
              <label className="text-sm font-medium">API Key</label>
              <input
                type="password"
                value={jiraDetails.apiKey}
                onChange={(e) => handleJiraDetailsChange("apiKey", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Your JIRA API Key"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Project Key</label>
              <input
                type="text"
                value={jiraDetails.projectKey}
                onChange={(e) => handleJiraDetailsChange("projectKey", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. TEST"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Issue Type</label>
              <select
                value={jiraDetails.issueType}
                onChange={(e) => handleJiraDetailsChange("issueType", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Test">Test</option>
                <option value="Story">Story</option>
                <option value="Task">Task</option>
                <option value="Bug">Bug</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Test Cases Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium flex items-center space-x-2">
            <span>Available Test Cases</span>
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              {testCases.length}
            </span>
          </h3>
          <label className="text-sm flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTestCases.length === testCases.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-primary"
            />
            <span>Select All</span>
          </label>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 hidden md:table-cell">Description</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {testCases.map((tc) => (
                <tr key={tc.id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTestCases.includes(tc.id)}
                      onChange={() => handleCheckboxChange(tc.id)}
                      className="rounded border-gray-300 text-primary"
                    />
                  </td>
                  <td className="px-4 py-3">{tc.id}</td>
                  <td className="px-4 py-3">{tc.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {tc.description?.slice(0, 60)}
                    {tc.description?.length > 60 ? "..." : ""}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isLoading || selectedTestCases.length === 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
              </svg>
              {storageOption === "excel" ? "Exporting..." : "Pushing..."}
            </div>
          ) : storageOption === "excel" ? (
            "Export to Excel"
          ) : (
            "Push to JIRA"
          )}
        </button>
      </div>
    </div>
  );
}
