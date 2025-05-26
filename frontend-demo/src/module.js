import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const Module = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [userStory, setUserStory] = useState("");
  const [url, setUrl] = useState("");
  const [pageName, setPageName] = useState("");
  const [inputType, setInputType] = useState("file");

  const [fullTestData, setFullTestData] = useState(null);
  const [loadingIngestion, setLoadingIngestion] = useState(false);
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const [error, setError] = useState("");
  const [testCases, setTestCases] = useState([]);
  const [ingestionSuccess, setIngestionSuccess] = useState(false); // ✅ for success message

  const MAX_FILES = 20;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUserStoryChange = (e) => setUserStory(e.target.value);
  const handleUrlChange = (e) => setUrl(e.target.value);
  const handlePageNameChange = (e) => setPageName(e.target.value);

  const handleContinue = async () => {
    let apiUrl = "";
    let data;
    let config = { headers: { "Content-Type": "application/json" } };

    setLoadingIngestion(true);
    setError("");
    setIngestionSuccess(false); // ✅ reset on new submission

    try {
      if (inputType === "file") {
        if (selectedFiles.length === 0) {
          toast("Please upload at least one file.");
          return;
        }

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("file", file));

        apiUrl = "http://localhost:8001/upload-image";
        data = formData;
        config.headers = { "Content-Type": "multipart/form-data" };

      } else if (inputType === "userStory") {
        if (userStory.trim() === "") {
          toast("Please enter a user story.");
          return;
        }

        apiUrl = "http://localhost:8001/rag/generate-from-story";
        data = JSON.stringify({ user_story: userStory }); // 👈 match the Pydantic model
        config.headers = { "Content-Type": "application/json" };



      } else if (inputType === "url") {
        if (url.trim() === "") {
          toast("Please enter a correct URL.");
          return;
        }

        try {
          new URL(url);
        } catch (_) {
          toast("Please enter a valid URL (e.g., https://example.com)");
          return;
        }

        apiUrl = "http://localhost:8001/launch-browser";
        data = JSON.stringify({ url, page_name: pageName });
      }

      const response = await axios.post(apiUrl, data, config);
      if (response.status === 200) {
        toast.success("Data sent successfully.");
        setIngestionSuccess(true); // ✅ trigger success message
      }

    } catch (error) {
      console.error("Error sending data to the API:", error);
      toast.error("There was an error sending the data.");
    } finally {
      setLoadingIngestion(false);
    }
  };

  const fetchTestCases = async () => {
    if (!url) {
      setError("Please enter a valid URL");
      return;
    }

    setLoadingGeneration(true);
    setError("");
    setTestCases([]);
    setFullTestData(null);

    try {
      const response = await axios.post("http://localhost:8001/rag/generate-and-run", {
        source_url: url
      });

      const data = response.data;
      setFullTestData(data);
      toast.success("Test case generation successful.");

    } catch (err) {
      setError(err.response?.data?.message || "Error fetching test cases");
    } finally {
      setLoadingGeneration(false);
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

        <div className="col-xl-12 m-5 mt-2">
          <h1 style={{ color: "#7857FF", fontSize: "28px" }}>
            AI-Powered Test Automation
          </h1>
          <p>Create, store, execute, and analyze automated tests with the power of AI.</p>
        </div>

        <div className="col-xl-12 m-5 mt-0" style={{ backgroundColor: "white", borderRadius: "5px", width: "92vw" }}>
          <div className="m-4">
            <h4>Data Ingestion</h4>
            <p style={{ color: "#bbbfc6" }}>
              Provide test requirements through document uploads, user stories, or a web application URL.
            </p>

            <div>
              <button className="btn btn-light me-4" onClick={() => setInputType("file")}>Upload files</button>
              <button className="btn btn-light me-4" onClick={() => setInputType("userStory")}>Enter User Story</button>
              <button className="btn btn-light" onClick={() => setInputType("url")}>Enter URL</button>
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
                </>
              )}

              {inputType === "userStory" && (
                <textarea
                  placeholder="Enter User Story"
                  onChange={handleUserStoryChange}
                  value={userStory}
                  className="form-control"
                  style={{ minHeight: "100px", backgroundColor: "#f8f9fc" }}
                ></textarea>
              )}

              {inputType === "url" && (
                <>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    onChange={handleUrlChange}
                    value={url}
                    className="form-control"
                    style={{ backgroundColor: "#f8f9fc", marginBottom: "10px" }}
                  />
                  <input
                    type="text"
                    placeholder="Page Name"
                    onChange={handlePageNameChange}
                    value={pageName}
                    className="form-control"
                    style={{ backgroundColor: "#f8f9fc" }}
                  />
                </>
              )}
            </div>

            <div className="d-flex mt-4 gap-3">
              <button
                onClick={handleContinue}
                disabled={loadingIngestion}
                style={{
                  backgroundColor: "#7857FF",
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
                  "Continue"
                )}
              </button>

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

            {/* ✅ Success Message */}
            {ingestionSuccess && (
              <p style={{ marginTop: "10px", color: "green", fontWeight: "bold" }}>
                ✅ Success
              </p>
            )}

            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

            {/* Test Case Table remains unchanged */}
            {fullTestData && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ marginBottom: "15px", color: "#7857FF", fontWeight: "bold", margin: "10px" }}>Test Case Details</h3>
                {Object.entries(fullTestData).map(([testCaseName, testDetails]) => (
                  <div key={testCaseName} style={{ marginBottom: "40px" }}>
                    <h4 style={{ color: "#333", margin: "20px 0 10px" }}>Page Name : {testCaseName}</h4>
                    <div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: "8px" }}>
                      <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: "Arial, sans-serif" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: "12px", backgroundColor: "#f2f2f2", borderBottom: "1px solid #ddd" }}>Key</th>
                            <th style={{ textAlign: "left", padding: "12px", backgroundColor: "#f2f2f2", borderBottom: "1px solid #ddd" }}>Output</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(testDetails).map(([key, value]) => (
                            <tr key={key}>
                              <td style={{ padding: "12px", borderBottom: "1px solid #ddd", fontWeight: "bold", verticalAlign: "top" }}>{key}</td>
                              <td style={{ padding: "12px", borderBottom: "1px solid #ddd", verticalAlign: "top", whiteSpace: "pre-wrap", maxWidth: "1000px" }}>
                                {typeof value === "string" ? (
                                  <pre style={{ margin: 0, fontFamily: "monospace", backgroundColor: "black", color: "white", padding: "12px", borderRadius: "4px", overflowX: "auto" }}>
                                    <code>{value}</code>
                                  </pre>
                                ) : (
                                  <code>{JSON.stringify(value, null, 2)}</code>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Module;
