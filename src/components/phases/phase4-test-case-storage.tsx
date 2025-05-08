
import React, { useState } from "react";
import { toast } from "sonner";
import { TestCase, TestStatus } from "@/lib/types";
import { MOCK_TEST_CASES } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";

interface Phase4Props {
  onComplete: () => void;
}

export default function Phase4TestCaseStorage({ onComplete }: Phase4Props) {
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

  const handleStorageOptionChange = (option: "excel" | "jira") => {
    setStorageOption(option);
  };

  const handleJiraDetailsChange = (field: keyof typeof jiraDetails, value: string) => {
    setJiraDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (selectedTestCases.length === 0) {
      toast.error("Please select at least one test case");
      return;
    }

    if (storageOption === "jira" && (!jiraDetails.url || !jiraDetails.apiKey || !jiraDetails.projectKey)) {
      toast.error("Please fill in all JIRA fields");
      return;
    }

    setIsLoading(true);

    // Mock storage operation
    setTimeout(() => {
      setIsLoading(false);
      
      if (storageOption === "excel") {
        toast.success(`Exported ${selectedTestCases.length} test cases to Excel`);
      } else {
        toast.success(`Pushed ${selectedTestCases.length} test cases to JIRA project ${jiraDetails.projectKey}`);
      }
      
      onComplete();
    }, 1500);
  };

  const toggleMappingFields = () => {
    setMappingFields(!mappingFields);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Test Case Storage</h2>
        <p className="text-muted-foreground">
          Store your test cases in Excel or push them to JIRA.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => handleStorageOptionChange("excel")}
            className={`flex-1 p-4 rounded-lg border ${
              storageOption === "excel" ? "border-primary bg-primary/5" : "border-border"
            } transition-colors`}
          >
            <div className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="8" y1="13" x2="16" y2="13"></line>
                <line x1="8" y1="17" x2="16" y2="17"></line>
              </svg>
              <div className="text-left">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.2 0 2.5 1 3.4.8.8 2.1 1.2 3.3 1 .6 1 1.8 1.6 3 1.6s2.4-.6 3-1.7c1.2.3 2.5 0 3.4-1 .8-.8 1.2-2 1-3.3 1-.6 1.6-1.8 1.6-3s-.6-2.4-1.7-3c.3-1.2 0-2.5-1-3.4a3.7 3.7 0 0 0-3.3-1c-.6-1-1.8-1.6-3-1.6z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <div className="text-left">
                <h3 className="font-medium">Push to JIRA</h3>
                <p className="text-xs text-muted-foreground">Create issues in your JIRA project</p>
              </div>
            </div>
          </button>
        </div>

        {storageOption === "jira" && (
          <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-medium">JIRA Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="jira-url" className="text-sm font-medium">
                  JIRA URL
                </label>
                <input
                  id="jira-url"
                  type="text"
                  placeholder="https://your-domain.atlassian.net"
                  value={jiraDetails.url}
                  onChange={(e) => handleJiraDetailsChange("url", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="jira-api-key" className="text-sm font-medium">
                  API Key
                </label>
                <input
                  id="jira-api-key"
                  type="password"
                  placeholder="Your JIRA API Key"
                  value={jiraDetails.apiKey}
                  onChange={(e) => handleJiraDetailsChange("apiKey", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="jira-project" className="text-sm font-medium">
                  Project Key
                </label>
                <input
                  id="jira-project"
                  type="text"
                  placeholder="e.g. TEST"
                  value={jiraDetails.projectKey}
                  onChange={(e) => handleJiraDetailsChange("projectKey", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="jira-issue-type" className="text-sm font-medium">
                  Issue Type
                </label>
                <select
                  id="jira-issue-type"
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
            
            <button
              onClick={toggleMappingFields}
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center space-x-1"
            >
              {mappingFields ? (
                <>
                  <span>Hide field mapping</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m18 15-6-6-6 6"/>
                  </svg>
                </>
              ) : (
                <>
                  <span>Configure field mapping</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </>
              )}
            </button>
            
            {mappingFields && (
              <div className="border-t pt-4 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    JIRA Summary
                  </label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="title">Test Case Title</option>
                    <option value="id">Test Case ID</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    JIRA Description
                  </label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="description">Test Case Description</option>
                    <option value="steps">Test Steps</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    JIRA Labels
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. automation, playwright"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    JIRA Components
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UI, Backend"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center space-x-2">
              <span>Available Test Cases</span>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {MOCK_TEST_CASES.length}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_TEST_CASES.map((testCase) => (
                  <tr key={testCase.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={selectedTestCases.includes(testCase.id)}
                        onChange={() => handleCheckboxChange(testCase.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isLoading || selectedTestCases.length === 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {storageOption === "excel" ? "Exporting..." : "Pushing to JIRA..."}
            </div>
          ) : (
            `${storageOption === "excel" ? "Export to Excel" : "Push to JIRA"}`
          )}
        </button>
      </div>
    </div>
  );
}
