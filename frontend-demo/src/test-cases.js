import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const TestCases = () => {
  const location = useLocation();
  const data = location.state?.data;

  // For displaying ocr_ids from initial data
  const ocrIds = Array.isArray(data)
    ? data.map((item, index) => (
        <li key={index}>{item.ocr_id}</li>
      ))
    : [];

  // For fetching test cases again from backend
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTestCases = async () => {
    setLoading(true);
    setError("");
    setTestCases([]);

    try {
      const response = await axios.post("http://localhost:2700/generate-test-cases", {
        url: "your-input-url-here" // Replace with actual URL or dynamic value if needed
      });

      const result = response.data.testCases; // Adjust based on your backend structure

      if (Array.isArray(result)) {
        setTestCases(result);
      } else {
        setError("Test cases not found in response");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch test cases");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>AI-Based Test Case Generation</h2>
      <p>
        Our AI analyzes your ChromaDB data and generates comprehensive test cases.
      </p>

      <h3>OCR IDs</h3>
      {ocrIds.length > 0 ? <ul>{ocrIds}</ul> : <p>No OCR IDs found.</p>}

      <hr />

      <h3>Generate Test Cases from URL</h3>
      <button onClick={fetchTestCases} style={{ padding: "6px 12px" }}>
        Generate
      </button>

      {loading && <p>Loading test cases...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {testCases.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h4>Generated Test Cases</h4>
          <ul>
            {testCases.map((tc, index) => (
              <li key={index}>{tc}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestCases;
