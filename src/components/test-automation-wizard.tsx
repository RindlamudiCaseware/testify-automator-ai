
import React, { useState } from "react";
import { PhaseStepper } from "@/components/phase-stepper";
import AssistantTips from "@/components/assistant-tips";

// Import all phases
import Phase1DataIngestion from "@/components/phases/phase1-data-ingestion";
import Phase2UrlMode from "@/components/phases/phase2-url-mode";
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
    }
  ],
  [
    {
      title: "URL Mode Best Practices",
      content: "For best results, enter the login URL of your application. Our crawler will navigate and analyze the structure automatically."
    },
    {
      title: "Authentication Support",
      content: "If your application requires authentication, you can provide credentials in the advanced options section."
    },
    {
      title: "URL Analysis Depth",
      content: "By default, we scan 3 levels deep from the provided URL. You can adjust this in settings for more thorough analysis."
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
    if (currentPhase < 8) {
      setCurrentPhase(currentPhase + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = () => {
    if (currentPhase < 8) {
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
      case 2:
        return <Phase2UrlMode onComplete={handleComplete} />;
      case 3:
        return <Phase3TestCaseGeneration onComplete={handleComplete} />;
      case 4:
        return <Phase4TestCaseStorage onComplete={handleComplete} />;
      case 5:
        return <Phase5CodeGeneration onComplete={handleComplete} />;
      case 6:
        return <Phase6BulkCodeGeneration onComplete={handleComplete} />;
      case 7:
        return <Phase7TestExecution onComplete={handleComplete} />;
      case 8:
        return <Phase8Analytics onComplete={handleComplete} />;
      default:
        return <div>Invalid phase</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto py-4 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                <path d="m16 18 6-6-6-6"></path>
                <path d="M8 6 2 12l6 6"></path>
                <path d="m19 12-7-4"></path>
                <path d="m19 12-7 4">
              </path>
              </svg>
            </div>
            <h1 className="text-xl font-bold">Testify</h1>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Docs
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI-Powered Test Automation</h1>
          <p className="text-muted-foreground">
            Create, store, execute, and analyze automated tests with the power of AI.
          </p>
        </div>
        
        <PhaseStepper currentPhase={currentPhase} onPhaseClick={handlePhaseClick} />
        
        <div className="bg-card border rounded-lg p-6">
          {renderCurrentPhase()}
        </div>
      </main>
      
      <AssistantTips tips={phaseTips[currentPhase - 1]} />
    </div>
  );
}
