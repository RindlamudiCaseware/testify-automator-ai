
import { Phase, TestStatus } from "./types";

export const PHASES: Phase[] = [
  {
    id: 1,
    title: "Data Ingestion",
    description: "Upload test data or enter URL",
    icon: "upload",
    completed: false,
    active: true,
  },
  {
    id: 2,
    title: "Test Generation",
    description: "AI-generated test cases",
    icon: "sparkles",
    completed: false,
    active: false,
  },
  {
    id: 3,
    title: "Test Storage",
    description: "Save to Excel or JIRA",
    icon: "database",
    completed: false,
    active: false,
  },
  {
    id: 4,
    title: "Code Generation",
    description: "Generate Playwright code",
    icon: "code",
    completed: false,
    active: false,
  },
  {
    id: 5,
    title: "Bulk Generation",
    description: "Code for multiple tests",
    icon: "files",
    completed: false,
    active: false,
  },
  {
    id: 6,
    title: "Test Execution",
    description: "Run tests and view results",
    icon: "play",
    completed: false,
    active: false,
  },
  {
    id: 7,
    title: "Analytics",
    description: "View test execution metrics",
    icon: "bar-chart",
    completed: false,
    active: false,
  },
];

export const MOCK_TEST_CASES = [
  {
    id: "tc-001",
    title: "User Login Functionality",
    description: "Verify that a user can successfully log in with valid credentials",
    steps: [
      "Navigate to the login page",
      "Enter valid username and password",
      "Click on the login button"
    ],
    expectedResults: [
      "User should be redirected to the dashboard",
      "Welcome message should be displayed"
    ],
    status: "passed" as TestStatus,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "tc-002",
    title: "Product Search Functionality",
    description: "Verify that a user can search for products",
    steps: [
      "Navigate to the home page",
      "Enter product name in the search box",
      "Click on the search button"
    ],
    expectedResults: [
      "Search results should be displayed",
      "Results should match the search criteria"
    ],
    status: "failed" as TestStatus,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "tc-003",
    title: "Add to Cart Functionality",
    description: "Verify that a user can add a product to cart",
    steps: [
      "Navigate to a product detail page",
      "Select product quantity",
      "Click on Add to Cart button"
    ],
    expectedResults: [
      "Product should be added to cart",
      "Cart count should be updated",
      "Success message should be displayed"
    ],
    status: "pending" as TestStatus,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const MOCK_ANALYTICS: Record<string, any> = {
  totalTestCases: 24,
  executedTestCases: 18,
  passedTestCases: 12,
  failedTestCases: 4,
  skippedTestCases: 2,
  executionTime: 245, // seconds
  successRate: 66.67,
  testExecutionHistory: [
    { date: "05/01", passed: 5, failed: 2, skipped: 1 },
    { date: "05/02", passed: 7, failed: 1, skipped: 0 },
    { date: "05/03", passed: 6, failed: 3, skipped: 1 },
    { date: "05/04", passed: 8, failed: 2, skipped: 0 },
    { date: "05/05", passed: 12, failed: 4, skipped: 2 },
  ],
};

export const SAMPLE_PLAYWRIGHT_CODE = `
import { test, expect } from '@playwright/test';

test('User Login Functionality', async ({ page }) => {
  // Navigate to the login page
  await page.goto('https://example.com/login');
  
  // Enter valid username and password
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'password123');
  
  // Click on the login button
  await page.click('#loginButton');
  
  // Verify user is redirected to dashboard
  await expect(page).toHaveURL('https://example.com/dashboard');
  
  // Verify welcome message is displayed
  const welcomeMessage = await page.locator('.welcome-message');
  await expect(welcomeMessage).toBeVisible();
  await expect(welcomeMessage).toContainText('Welcome');
});
`;
