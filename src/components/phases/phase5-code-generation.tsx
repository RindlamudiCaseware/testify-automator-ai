
import React, { useState } from "react";
import { toast } from "sonner";
import { TestCase } from "@/lib/types";
import { MOCK_TEST_CASES, SAMPLE_PLAYWRIGHT_CODE } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";
import CodeViewer from "@/components/code-viewer";

interface Phase5Props {
  onComplete: () => void;
}

export default function Phase5CodeGeneration({ onComplete }: Phase5Props) {
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const handleTestCaseSelect = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setGeneratedCode("");
  };

  const generateCode = () => {
    if (!selectedTestCase) {
      toast.error("Please select a test case first");
      return;
    }

    setIsGenerating(true);
    
    // Mock code generation with a delay
    setTimeout(() => {
      setGeneratedCode(SAMPLE_PLAYWRIGHT_CODE);
      setIsGenerating(false);
      toast.success(`Generated Playwright test code for ${selectedTestCase.title}`);
    }, 1500);
  };

  const saveCode = () => {
    if (!generatedCode) {
      toast.error("No code to save");
      return;
    }

    toast.success("Test code saved successfully");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Code Generation</h2>
        <p className="text-muted-foreground">
          Generate Playwright test automation code for your selected test case.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-medium">Select a Test Case</h3>
          <div className="border rounded-lg overflow-y-auto max-h-[600px]">
            <div className="divide-y divide-border">
              {MOCK_TEST_CASES.map((testCase) => (
                <div
                  key={testCase.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedTestCase?.id === testCase.id ? "bg-primary/5 border-l-4 border-primary" : ""
                  }`}
                  onClick={() => handleTestCaseSelect(testCase)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{testCase.title}</h4>
                    <StatusBadge status={testCase.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{testCase.description}</p>
                  
                  {selectedTestCase?.id === testCase.id && (
                    <div className="mt-3 text-sm">
                      <h5 className="font-medium mb-1">Steps:</h5>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        {testCase.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                      
                      <h5 className="font-medium mt-3 mb-1">Expected Results:</h5>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        {testCase.expectedResults.map((result, index) => (
                          <li key={index}>{result}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Generated Playwright Code</h3>
            <div className="flex space-x-2">
              <button
                onClick={generateCode}
                disabled={!selectedTestCase || isGenerating}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-1">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                    <span>Generate Code</span>
                  </div>
                )}
              </button>
              
              {generatedCode && (
                <button
                  onClick={saveCode}
                  className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                >
                  <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>Save Code</span>
                  </div>
                </button>
              )}
            </div>
          </div>
          
          {generatedCode ? (
            <CodeViewer 
              code={generatedCode} 
              language="typescript" 
              title={selectedTestCase ? `${selectedTestCase.id} - ${selectedTestCase.title}` : "Generated Code"}
              showLineNumbers={true}
              className="h-[600px]"
            />
          ) : (
            <div className="border border-dashed rounded-lg h-[600px] flex flex-col items-center justify-center text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              <p className="mt-4 text-center">
                {selectedTestCase 
                  ? "Click 'Generate Code' to create Playwright test script"
                  : "Select a test case to generate code"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={!generatedCode}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
