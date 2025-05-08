
import React, { useState } from "react";
import { toast } from "sonner";
import { TestCase } from "@/lib/types";
import { MOCK_TEST_CASES } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";

interface Phase7Props {
  onComplete: () => void;
}

interface ExecutionLog {
  testCaseId: string;
  message: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "success";
}

export default function Phase7TestExecution({ onComplete }: Phase7Props) {
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [results, setResults] = useState<{
    [key: string]: { status: "passed" | "failed" | "skipped" | "pending" }
  }>({});

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

  const addLog = (testCaseId: string, message: string, level: ExecutionLog["level"]) => {
    setExecutionLogs(prev => [
      ...prev,
      {
        testCaseId,
        message,
        timestamp: new Date(),
        level,
      }
    ]);
  };

  const runTests = () => {
    if (selectedTestCases.length === 0) {
      toast.error("Please select at least one test case");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setExecutionLogs([]);
    setResults({});
    
    // Initialize all selected tests as pending
    const initialResults = selectedTestCases.reduce((acc, id) => {
      acc[id] = { status: "pending" };
      return acc;
    }, {} as { [key: string]: { status: "passed" | "failed" | "skipped" | "pending" } });
    
    setResults(initialResults);
    
    // Mock test execution with progress updates and logs
    let currentProgress = 0;
    const increment = 100 / selectedTestCases.length;
    
    // Add initial log
    addLog("global", "Starting test execution...", "info");
    
    let testIndex = 0;
    const runNextTest = () => {
      if (testIndex >= selectedTestCases.length) {
        setProgress(100);
        addLog("global", "Test execution completed!", "success");
        setIsRunning(false);
        return;
      }
      
      const testId = selectedTestCases[testIndex];
      const testCase = MOCK_TEST_CASES.find(tc => tc.id === testId)!;
      
      // Update progress
      currentProgress = Math.min((testIndex + 1) * increment, 100);
      setProgress(Math.round(currentProgress));
      
      // Start test
      addLog(testId, `Starting test: ${testCase.title}`, "info");
      
      // Mock test execution steps with delays
      setTimeout(() => {
        // First step
        addLog(testId, `Executing: ${testCase.steps[0]}`, "info");
        
        setTimeout(() => {
          // Some more steps with variable timing
          if (testCase.steps.length > 1) {
            addLog(testId, `Executing: ${testCase.steps[1]}`, "info");
          }
          
          setTimeout(() => {
            if (testCase.steps.length > 2) {
              addLog(testId, `Executing: ${testCase.steps[2]}`, "info");
            }
            
            // Determine test result (random for demonstration)
            const random = Math.random();
            let status: "passed" | "failed" | "skipped";
            
            if (random > 0.3) {
              status = "passed";
              addLog(testId, `Test passed: ${testCase.expectedResults[0]}`, "success");
            } else if (random > 0.1) {
              status = "failed";
              addLog(
                testId, 
                `Test failed: Expected ${testCase.expectedResults[0]} but got different result`, 
                "error"
              );
            } else {
              status = "skipped";
              addLog(testId, `Test skipped due to dependencies`, "warn");
            }
            
            // Update results
            setResults(prev => ({
              ...prev,
              [testId]: { status }
            }));
            
            // Move to next test
            testIndex++;
            setTimeout(runNextTest, 500);
          }, 800);
        }, 1000);
      }, 500);
    };
    
    // Start running tests
    runNextTest();
  };

  const getTestStatus = (testId: string): "passed" | "failed" | "skipped" | "pending" => {
    return results[testId]?.status || "pending";
  };

  const getLevelClass = (level: ExecutionLog["level"]): string => {
    switch (level) {
      case "info":
        return "text-info";
      case "warn":
        return "text-warning";
      case "error":
        return "text-destructive";
      case "success":
        return "text-success";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Test Execution</h2>
        <p className="text-muted-foreground">
          Run your automated tests and view results in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Available Tests</h3>
            <label className="text-sm flex items-center space-x-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedTestCases.length === MOCK_TEST_CASES.length}
                onChange={handleSelectAll}
                disabled={isRunning}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>All</span>
            </label>
          </div>
          
          <div className="border rounded-lg overflow-y-auto max-h-[400px]">
            <div className="divide-y divide-border">
              {MOCK_TEST_CASES.map((testCase) => (
                <div
                  key={testCase.id}
                  className="p-3 hover:bg-muted/20 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={selectedTestCases.includes(testCase.id)}
                      onChange={() => handleCheckboxChange(testCase.id)}
                      disabled={isRunning}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium text-sm">{testCase.title}</p>
                      <p className="text-xs text-muted-foreground">{testCase.id}</p>
                    </div>
                  </div>
                  
                  {results[testCase.id] && (
                    <StatusBadge status={getTestStatus(testCase.id)} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">
              {selectedTestCases.length} tests selected
            </span>
            <button
              onClick={runTests}
              disabled={isRunning || selectedTestCases.length === 0}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <div className="flex items-center space-x-1">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Running...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>Run Tests</span>
                </div>
              )}
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-medium">Execution Logs</h3>
          
          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Progress</span>
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
          
          <div className="border rounded-lg bg-black/90 text-white p-2 h-[400px] overflow-y-auto font-mono text-sm">
            {executionLogs.length > 0 ? (
              <div className="space-y-1">
                {executionLogs.map((log, index) => (
                  <div key={index} className={`flex ${getLevelClass(log.level)}`}>
                    <span className="text-gray-500 mr-2">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>
                    <span className="text-gray-400 mr-2">
                      [{log.testCaseId}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No logs to display. Run tests to see execution logs.</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <div>
              {Object.values(results).length > 0 && (
                <div className="flex space-x-3">
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-success"></span>
                    <span className="text-xs">{Object.values(results).filter(r => r.status === "passed").length} passed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-destructive"></span>
                    <span className="text-xs">{Object.values(results).filter(r => r.status === "failed").length} failed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-warning"></span>
                    <span className="text-xs">{Object.values(results).filter(r => r.status === "skipped").length} skipped</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {executionLogs.length > 0 && (
                <button
                  className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                >
                  Export Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={isRunning}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {Object.values(results).length > 0 ? "Continue to Dashboard" : "Skip"}
        </button>
      </div>
    </div>
  );
}
