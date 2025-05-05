
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending';

export type TestCase = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResults: string[];
  status: TestStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type Phase = {
  id: number;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  active: boolean;
};

export type TestCaseExecution = {
  id: string;
  testCaseId: string;
  startTime: Date;
  endTime?: Date;
  status: TestStatus;
  logs: string[];
  screenshots: string[];
};

export type JiraFields = {
  project: string;
  issueType: string;
  summary: string;
  description: string;
  labels: string[];
  components: string[];
  priority: string;
};

export type AnalyticsData = {
  totalTestCases: number;
  executedTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  skippedTestCases: number;
  executionTime: number;
  successRate: number;
};

