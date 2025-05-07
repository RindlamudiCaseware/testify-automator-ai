
import React, { useState } from "react";
import { PhaseStepper } from "@/components/phase-stepper";
import AssistantTips from "@/components/assistant-tips";

// Import all phases
import Phase1DataIngestion from "@/components/phases/phase1-data-ingestion";
import Phase3TestCaseGeneration from "@/components/phases/phase3-test-case-generation";
import Phase4TestCaseStorage from "@/components/phases/phase4-test-case-storage";
import Phase5CodeGeneration from "@/components/phases/phase5-code-generation";
import Phase6BulkCodeGeneration from "@/components/phases/phase6-bulk-code-generation";
import Phase7TestExecution from "@/components/phases/phase7-test-execution";
import Phase8Analytics from "@/components/phases/phase8-analytics";

// AI assistant tips for each phase
const phaseTips = [
  [
    {
      title: "Best Practices for Data Ingestion",
      content: "Upload a variety of documents to ensure your AI model has enough context. Include screenshots, user stories, and requirements documentation."
    },
    {
      title: "Supported File Types",
      content: "Our system supports PDF, Word docs, Excel files, images (PNG, JPEG), and text files. All data is securely stored in ChromaDB."
    },
    {
      title: "Data Privacy Tip",
      content: "Make sure your files don't contain sensitive information like passwords, API keys, or personal data before uploading."
    },
    {
      title: "URL Mode Best Practices",
      content: "For best results, enter the login URL of your application. Our crawler will navigate and analyze the structure automatically."
    },
    {
      title: "Authentication Support",
      content: "If your application requires authentication, you can provide credentials in the advanced options section."
    }
  ],
  [
    {
      title: "AI Test Generation Tips",
      content: "The AI generates tests based on common user journeys and critical paths through your application."
    },
    {
      title: "Refining Test Cases",
      content: "You can refine generated test cases by clicking 'Refine' and providing additional context or requirements."
    },
    {
      title: "Test Quality",
      content: "Tests are automatically prioritized by impact and complexity. High-value tests appear at the top of the list."
    }
  ],
  [
    {
      title: "JIRA Integration Tips",
      content: "Map test steps to JIRA description field and expected results to acceptance criteria for better readability."
    },
    {
      title: "Excel Export Format",
      content: "Excel exports include separate sheets for test cases, test steps, and execution history for comprehensive documentation."
    },
    {
      title: "Custom Field Mapping",
      content: "You can create custom field mappings for JIRA to match your team's specific workflow and requirements."
    }
  ],
  [
    {
      title: "Playwright Code Best Practices",
      content: "Generated code uses Playwright's Page Object Model pattern for better maintainability and reusability."
    },
    {
      title: "Code Customization",
      content: "You can edit the generated code directly in the editor before saving to customize it for your specific needs."
    },
    {
      title: "Framework Support",
      content: "Our generated code works with Playwright Test, Jest, and Mocha test runners with minimal configuration."
    }
  ],
  [
    {
      title: "Git Integration Tips",
      content: "When pushing to Git, tests are organized in folders by feature area for better organization."
    },
    {
      title: "Branch Strategy",
      content: "Consider using a dedicated branch like 'automation-tests' for your test code to separate it from application code."
    },
    {
      title: "CI/CD Integration",
      content: "Generated tests include GitHub Actions and Jenkins pipeline examples for continuous testing."
    }
  ],
  [
    {
      title: "Execution Environment",
      content: "Tests run in isolated containers with fresh browser instances to prevent cross-test contamination."
    },
    {
      title: "Parallel Execution",
      content: "For faster results, tests are automatically executed in parallel when possible."
    },
    {
      title: "Screenshot Capture",
      content: "On test failure, screenshots and trace files are automatically captured for easier debugging."
    }
  ],
  [
    {
      title: "Dashboard Insights",
      content: "The success rate metric is calculated based on the last 7 days of test executions for trending analysis."
    },
    {
      title: "Report Sharing",
      content: "Download and share reports in PDF or HTML format with stakeholders directly from the dashboard."
    },
    {
      title: "Trend Analysis",
      content: "Watch for patterns in failing tests to identify unstable application areas or flaky tests that need attention."
    }
  ]
];

export default function TestAutomationWizard() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const maxCompletedPhase = currentPhase;
  
  const handlePhaseClick = (phaseId: number) => {
    // Only allow navigating to completed phases or the next phase
    if (phaseId <= maxCompletedPhase) {
      setCurrentPhase(phaseId);
    }
  };
  
  const goToNextPhase = () => {
    if (currentPhase < 7) {  // Now we have 7 total phases instead of 8
      setCurrentPhase(currentPhase + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = () => {
    if (currentPhase < 7) {  // Now we have 7 total phases instead of 8
      goToNextPhase();
    } else {
      // Final phase completion action
      setCurrentPhase(1); // Reset to first phase
    }
  };
  
  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 1:
        return <Phase1DataIngestion onComplete={handleComplete} />;
      case 2:  // This is now TestCaseGeneration (previously Phase 3)
        return <Phase3TestCaseGeneration onComplete={handleComplete} />;
      case 3:  // This is now TestCaseStorage (previously Phase 4)
        return <Phase4TestCaseStorage onComplete={handleComplete} />;
      case 4:  // This is now CodeGeneration (previously Phase 5)
        return <Phase5CodeGeneration onComplete={handleComplete} />;
      case 5:  // This is now BulkCodeGeneration (previously Phase 6)
        return <Phase6BulkCodeGeneration onComplete={handleComplete} />;
      case 6:  // This is now TestExecution (previously Phase 7)
        return <Phase7TestExecution onComplete={handleComplete} />;
      case 7:  // This is now Analytics (previously Phase 8)
        return <Phase8Analytics onComplete={handleComplete} />;
      default:
        return <div>Invalid phase</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto py-5 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                <path d="m16 18 6-6-6-6"></path>
                <path d="M8 6 2 12l6 6"></path>
                <path d="m19 12-7-4"></path>
                <path d="m19 12-7 4"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Testify</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                  </svg>
                  Docs
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70">
                    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M11 8h.01"></path>
                    <path d="M11 12h.01"></path>
                    <path d="M11 16h.01"></path>
                  </svg>
                  Support
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto py-10 px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">AI-Powered Test Automation</h1>
          <p className="text-lg text-muted-foreground">
            Create, store, execute, and analyze automated tests with the power of AI.
          </p>
        </div>
        
        <PhaseStepper currentPhase={currentPhase} onPhaseClick={handlePhaseClick} />
        
        <div className="bg-card border rounded-xl p-8 shadow-sm mt-8 animate-fade-in">
          {renderCurrentPhase()}
        </div>
      </main>
      
      <AssistantTips tips={phaseTips[currentPhase - 1]} />
    </div>
  );
}
