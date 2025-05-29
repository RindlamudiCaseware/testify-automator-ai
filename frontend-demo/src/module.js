import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import IconNav from "./icons";

const Module = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [userStory, setUserStory] = useState("");
  const [url, setUrl] = useState("");
  const [inputType, setInputType] = useState("file");

  const [fullTestData, setFullTestData] = useState(null);
  const [loadingIngestion, setLoadingIngestion] = useState(false);
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const [error, setError] = useState("");
  const [testCases, setTestCases] = useState([]);
  const [ingestionSuccess, setIngestionSuccess] = useState(false); // ✅ for success message

  const [testCasesGeneratedFromStory, setTestCasesGeneratedFromStory] = useState(null);

  const [executionResult, setExecutionResult] = useState(null);
  const [loadingExecution, setLoadingExecution] = useState(false);

  const [loadingEnrich, setLoadingEnrich] = useState(false);

  const MAX_FILES = 20;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUserStoryChange = (e) => setUserStory(e.target.value);
  const handleUrlChange = (e) => setUrl(e.target.value);

  const handleContinue = async () => {
    setLoadingIngestion(true);
    setError("");
    setIngestionSuccess(false);

    if (selectedFiles.length === 0) {
      toast("Please upload at least one file.");
      setLoadingIngestion(false);
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("file", file));

    try {
      const response = await axios.post(
        "http://localhost:8001/upload-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        toast.success("Files uploaded successfully.");
        setIngestionSuccess(true);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Error uploading files. Please try again.");
    } finally {
      setLoadingIngestion(false);
    }
  };

  const fetchTestCases = async () => {
    if (!userStory || userStory.trim() === "") {
      setError("Please enter a user story.");
      return;
    }

    setLoadingGeneration(true);
    setError("");
    setTestCases([]);
    setTestCasesGeneratedFromStory(null); // updated variable

    try {
      const response = await axios.post("http://localhost:8001/rag/generate-from-story", {
        user_story: userStory
      });

      const data = response.data;
      setTestCasesGeneratedFromStory(data); // updated variable
      toast.success("Test case generation successful.");
    } catch (err) {
      setError(err.response?.data?.message || "Error generating test cases.");
    } finally {
      setLoadingGeneration(false);
    }
  };


  const enrichLocaters = async () => {
  if (!url || url.trim() === "") {
    setError("Please enter a valid URL");
    return;
  }

  try {
    new URL(url);
  } catch (_) {
    setError("Please enter a valid URL format (e.g., https://example.com)");
    return;
  }

  setLoadingEnrich(true);
  setError("");
  setTestCases([]);
  setFullTestData(null);

  try {
    const response = await axios.post("http://localhost:8001/launch-browser", {
      url: url  // ✅ Correct key matching the backend
    });

    const data = response.data;
    setFullTestData(data);
    toast.success("Locator enrichment successful.");
  } catch (err) {
    setError(err.response?.data?.message || "Error enriching locators");
  } finally {
    setLoadingEnrich(false);
  }
};



  const executeStoryTest = async () => {
    setLoadingExecution(true); // 👈 use separate loader
    setError("");
    setExecutionResult(null);

    try {
      const response = await axios.post("http://localhost:8001/rag/run-generated-story-test");
      setExecutionResult(response.data);
      toast.success("Execution successful.");
    } catch (err) {
      setError(err.response?.data?.message || "Error executing story test.");
    } finally {
      setLoadingExecution(false); // 👈 stop loader
    }
  };

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <ToastContainer />
      <div className="row m-0">
        <div className="col-12" style={{ backgroundColor: "#efedfc", height: "80px" }}>
          <div className="d-flex justify-content-between align-items-center h-100 px-4">
            <h3 style={{ color: "#7857FF", fontFamily: "Segoe UI", fontWeight: "bold" }}>Testify</h3>
            <div className="d-flex gap-3">
              <p className="mb-0">Docs</p>
              <p className="mb-0">Support</p>
            </div>
          </div>
        </div>

        <div className="col-xl-12 m-5 mt-5 mb-0">
          <h1 style={{ color: "#7857FF", fontSize: "28px" }}>
            AI-Powered Test Automation
          </h1>
          <p>Create, store, execute, and analyze automated tests with the power of AI.</p>
        </div>

        <div>
            <IconNav/>
        </div>


        <div className="col-xl-12 m-5 mt-0" style={{ backgroundColor: "white", borderRadius: "5px", width: "92vw" }}>
          <div className="m-4">
            <h4>Data Ingestion</h4>
            <p style={{ color: "#bbbfc6" }}>
              Provide test requirements through document uploads, user stories, or a web application URL.
            </p>

            <div>
              <button className="btn btn-secondary me-4" onClick={() => setInputType("file")}>Upload files</button>
              <button className="btn btn-secondary me-4" onClick={() => setInputType("userStory")}>Enter User Story</button>
              <button className="btn btn-secondary me-4" onClick={() => setInputType("url")}>Enter URL</button><button 
                onClick={executeStoryTest}
                disabled={loadingExecution}
                className="btn btn-secondary me-4"
                style={{
                  height:"40px",
                  width:"90px"
                }}
              > 
                {loadingExecution ? (
                  <div className="spinner-border spinner-border-sm text-light" role="status" style={{ width: "20px", height: "20px" }} />
                ) : (
                  "Execute"
                )}
              </button>
            </div>

            <hr />

            <div style={{ border: "2px solid #f6f6f8", padding: "20px", borderRadius: "5px" }}>
              {inputType === "file" && (
                <>
                  <div className="p-4 text-center"
                    style={{ border: "2px dashed #d6d8e1", borderRadius: "5px", backgroundColor: "#fafbfe", cursor: "pointer" }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedFiles = Array.from(e.dataTransfer.files);
                      if (selectedFiles.length + droppedFiles.length > MAX_FILES) {
                        toast.error(`Maximum ${MAX_FILES} files allowed.`);
                        return;
                      }
                      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
                    }}
                    onClick={() => document.getElementById("file-upload").click()}
                  >
                    <i className="bi bi-cloud-arrow-up" style={{ fontSize: "45px", color: "#7857FF" }}></i>
                    <h6 style={{ color: "#8b6ffe" }}>Upload your Test Data</h6>
                    <p>Drag & drop your files here or click to browse</p>
                    <input id="file-upload" type="file" multiple onChange={handleFileUpload} style={{ display: "none" }} />
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="row mt-4">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="col-3 mb-3">
                          <div className="card shadow-sm">
                            <div className="card-body p-2">
                              <p className="card-text text-truncate">{file.name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      onClick={handleContinue}
                      disabled={loadingIngestion}
                      style={{
                        backgroundColor: "green",
                        border: "none",
                        borderRadius: "10px",
                        color: "white",
                        padding: "10px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "100px",
                        height: "40px",
                      }}
                    >
                      {loadingIngestion ? (
                        <div className="spinner-border spinner-border-sm text-light" role="status" style={{ width: "20px", height: "20px" }} />
                      ) : (
                        "Upload Files"
                      )}
                    </button>
                    </div>
                </>
                
              )}

              {inputType === "userStory" && (
                <div>
                  <h5 className="mb-3"> Enter user story or requirements </h5>
                    <textarea
                    placeholder="As an user, I want to be able to.. so that I can..."
                    onChange={handleUserStoryChange}
                    value={userStory}
                    className="form-control"
                    style={{ minHeight: "100px", backgroundColor: "#f8f9fc" }}
                  ></textarea>
                  <div className="mt-4">
                    <button
                      onClick={fetchTestCases}
                      disabled={loadingGeneration}
                      style={{
                        backgroundColor: "green",
                        border: "none",
                        borderRadius: "10px",
                        color: "white",
                        padding: "10px 20px",
                        minWidth: "180px",
                        height: "40px"
                      }}
                    >
                      {loadingGeneration ? (
                        <div className="spinner-border spinner-border-sm text-light" role="status" style={{ width: "20px", height: "20px" }} />
                      ) : (
                        "Generate Test Cases"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {inputType === "url" && (
                <>
                  <h5> Enter Web Application URL </h5>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    onChange={handleUrlChange}
                    value={url}
                    className="form-control"
                    style={{ backgroundColor: "#f8f9fc", marginBottom: "40px",width:"500px", marginTop:"20px" }}
                  />
                  
                  <div className="mt-4">
                      <button 
                        onClick={enrichLocaters}
                        disabled={loadingEnrich}
                        style={{
                          backgroundColor: "green",
                          border: "none",
                          borderRadius: "10px",
                          color: "white",
                          padding: "10px 20px",
                          minWidth: "180px",
                          height: "40px"
                        }}
                      >
                        {loadingEnrich ? (
                          <div className="spinner-border spinner-border-sm text-light" role="status" style={{ width: "20px", height: "20px" }} />
                        ) : (
                          "Enrich Locaters"
                        )}
                      </button>
                  </div>
                </>
              )}
            </div>

            {/* ✅ Success Message */}
            {ingestionSuccess && (
              <p style={{ marginTop: "10px", color: "green", fontWeight: "bold" }}>
                ✅ Success
              </p>
            )}

            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

            {/* story test cases diaplay */}
            {testCasesGeneratedFromStory && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  backgroundColor: "#fafafa",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                <h4 style={{ marginBottom: "15px", color: "#333" }}>Generated Test Cases:</h4>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    fontSize: "14px",
                    color: "#444",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          border: "1px solid #ccc",
                          padding: "12px",
                          textAlign: "left",
                          backgroundColor: "#e8e8e8",
                          fontWeight: "600",
                          width: "50%",
                        }}
                      >
                        Manual Test Cases
                      </th>
                      <th
                        style={{
                          border: "1px solid #ccc",
                          padding: "12px",
                          textAlign: "left",
                          backgroundColor: "#e8e8e8",
                          fontWeight: "600",
                          width: "50%",
                        }}
                      >
                        Automated Test Cases
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "12px",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          verticalAlign: "top",
                          backgroundColor: "#fff",
                        }}
                      >
                        {testCasesGeneratedFromStory.manual_testcase}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "12px",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          fontFamily: "Consolas, monospace",
                          fontSize: "13px",
                          backgroundColor: "#f7f7f7",
                          verticalAlign: "top",
                        }}
                      >
                        {testCasesGeneratedFromStory.auto_testcase}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Test Case Table */}
            {fullTestData && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ color: "#7857FF", fontWeight: "bold", margin: "10px" }}>
                  Test Case JSON Output
                </h3>
                <pre style={{ backgroundColor: "#000", color: "#0f0", padding: "15px", borderRadius: "5px", overflowX: "auto" }}>
                  {JSON.stringify(fullTestData, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Execute test cases */}
            {executionResult && (
              <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "10px" }}>
                <h4>Execution Result:</h4>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left", backgroundColor: "#f0f0f0" }}>Key</th>
                      <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left", backgroundColor: "#f0f0f0" }}>Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(executionResult).map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ border: "1px solid #ccc", padding: "8px", verticalAlign: "top", fontWeight: "bold" }}>
                          {key}
                        </td>
                        <td
                          style={{
                            border: "1px solid #ccc",
                            padding: "8px",
                            whiteSpace: key === "log" ? "pre-wrap" : "normal",
                            backgroundColor: key === "log" ? "#000" : "transparent",
                            color: key === "log" ? "#0f0" : "inherit",
                            fontFamily: key === "log" ? "monospace" : "inherit",
                            maxHeight: key === "log" ? "150px" : "auto",
                            overflowY: key === "log" ? "auto" : "visible",
                          }}
                        >
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Module;
