// src/api.tsx

import axios from 'axios';
import { TestCase } from "@/lib/types"; // ✅ type import for consistency

const BASE_URL = "http://127.0.0.1:8001"; // Update if backend is deployed elsewhere

// Axios instance
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" }
});

export { apiClient };

// ✅ Upload image or ZIP
export async function uploadImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await apiClient.post("/upload-image", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    } catch (error: any) {
        console.error("uploadImage error:", error);
        throw error.response?.data?.detail || error.message || "Upload failed";
    }
}

// ✅ Submit URL for locator extraction
export async function submitUrl(url: string): Promise<any> {
    try {
        const response = await apiClient.post("/submit-url", { url });
        return response.data;
    } catch (error: any) {
        console.error("submitUrl error:", error);
        throw error.response?.data?.detail || error.message || "URL submission failed";
    }
}

// ✅ Fetch test cases
export async function fetchTestCases(): Promise<TestCase[]> {
    try {
        const response = await apiClient.get("/chroma/data");
        return response.data;
    } catch (error: any) {
        console.error("fetchTestCases error:", error);
        throw error.response?.data?.detail || error.message || "Fetching test cases failed";
    }
}

// ✅ Export test cases to Excel
export async function exportToExcel(testCases: TestCase[]): Promise<any> {
    try {
        const response = await apiClient.post("/export-excel", { testCases });
        return response.data;
    } catch (error: any) {
        console.error("exportToExcel error:", error);
        throw error.response?.data?.detail || error.message || "Excel export failed";
    }
}

// ✅ Push test cases to JIRA
export async function pushToJira(testCases: TestCase[], jiraConfig: {
    url: string;
    apiKey: string;
    projectKey: string;
    issueType: string;
}): Promise<any> {
    try {
        const payload = { testCases, jiraConfig };
        const response = await apiClient.post("/push-jira", payload);
        return response.data;
    } catch (error: any) {
        console.error("pushToJira error:", error);
        throw error.response?.data?.detail || error.message || "Pushing to JIRA failed";
    }
}

export async function fetchGeneratedCode(testCaseId: string): Promise<string> {
    try {
      const response = await apiClient.get(`/generate-code/${testCaseId}`);
      return response.data.code; // assuming backend returns { code: "..." }
    } catch (error: any) {
      console.error("fetchGeneratedCode error:", error);
      throw error.response?.data?.detail || error.message || "Code generation failed";
    }
  }
  
  // ✅ Add this in src/api.tsx

export async function generateBulkCode(
  testCaseIds: string[],
  gitOptions: { gitRepo: string; gitBranch: string }
): Promise<{ results: { id: string; title: string; status: "completed" | "failed" }[] }> {
  try {
    const payload = { testCaseIds, gitOptions };
    const response = await apiClient.post("/generate-bulk-code", payload);
    return response.data;
  } catch (error: any) {
    console.error("generateBulkCode error:", error);
    throw error.response?.data?.detail || error.message || "Bulk code generation failed";
  }
}
