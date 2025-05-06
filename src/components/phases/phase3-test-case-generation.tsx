
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { TestCase, TestStatus } from "@/lib/types";
import { MOCK_TEST_CASES } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";
import { chromaClient } from "@/lib/chroma-client";

interface Phase3Props {
  onComplete: () => void;
}

export default function Phase3TestCaseGeneration({ onComplete }: Phase3Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [chromaCollection, setChromaCollection] = useState("test_automation");
  
  const generateTestCases = async () => {
    setIsGenerating(true);
    setProgress(0);
    setTestCases([]);
    
    try {
      // Fetch data from ChromaDB to generate test cases
      console.log("Fetching data from ChromaDB collection:", chromaCollection);
      
      // Mock the loading process first
      let currentProgress = 0;
      const timer = setInterval(() => {
        currentProgress += 10;
        setProgress(currentProgress);
        
        // Add test cases gradually - in real implementation this would
        // use data from ChromaDB to generate test cases
        if (currentProgress === 30) {
          setTestCases([MOCK_TEST_CASES[0]]);
        }
        if (currentProgress === 60) {
          setTestCases([MOCK_TEST_CASES[0], MOCK_TEST_CASES[1]]);
        }
        if (currentProgress === 90) {
          setTestCases(MOCK_TEST_CASES);
        }
        
        if (currentProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsGenerating(false);
            toast.success(`Successfully generated ${MOCK_TEST_CASES.length} test cases from ChromaDB data`);
          }, 500);
        }
      }, 400);
      
      // In a real application with ChromaDB, we'd query the database
      // and generate test cases based on the retrieved data
      /*
      try {
        // Query ChromaDB for stored data
        const queryResult = await chromaClient.queryCollection(
          chromaCollection,
          ["test cases", "requirements"], // Example query
          10 // Get top 10 relevant documents
        );
        
        if (queryResult && queryResult.documents && queryResult.documents.length > 0) {
          // Process the retrieved documents and generate test cases
          // This would be a more complex process in a real application
          
          // Example processing:
          const generatedTestCases: TestCase[] = [];
          
          // Generate test cases based on ChromaDB query results
          queryResult.documents[0].forEach((doc, index) => {
            if (!doc) return;
            
            generatedTestCases.push({
              id: `tc-${String(index + 1).padStart(3, '0')}`,
              title: `Generated Test Case ${index + 1}`,
              description: doc.substring(0, 100),
              steps: ["Step 1", "Step 2", "Step 3"],
              expectedResults: ["Expected Result 1", "Expected Result 2"],
              status: "pending" as TestStatus,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          });
          
          setTestCases(generatedTestCases);
        }
      } catch (error) {
        console.error("Error querying ChromaDB:", error);
        // Fall back to mock data
        setTestCases(MOCK_TEST_CASES);
      }
      */

    } catch (error) {
      console.error("Error generating test cases:", error);
      toast.error("Error occurred while generating test cases");
      setIsGenerating(false);
    }
  };
  
  // Start generation automatically on component mount
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

      {/* ChromaDB Collection selector */}
      <div className="p-4 border rounded-lg bg-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">ChromaDB Collection</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={chromaCollection}
              onChange={(e) => setChromaCollection(e.target.value)}
              placeholder="Collection name"
              className="px-3 py-1 text-sm border rounded-md"
              disabled={isGenerating}
            />
          </div>
        </div>
      </div>

      {isGenerating ? (
        <div className="p-6 border rounded-lg bg-card space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Generating test cases from ChromaDB data...</span>
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
              {progress < 30 && "Analyzing application structure from ChromaDB..."}
              {progress >= 30 && progress < 60 && "Identifying key functionality from embeddings..."}
              {progress >= 60 && progress < 90 && "Creating test scenarios based on vector similarity..."}
              {progress >= 90 && "Finalizing test cases with semantic understanding..."}
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
              <button
                className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
              >
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <span>Refine</span>
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
                      <button className="text-primary hover:text-primary/80 px-2">
                        View
                      </button>
                      <button className="text-primary hover:text-primary/80 px-2">
                        Edit
                      </button>
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
