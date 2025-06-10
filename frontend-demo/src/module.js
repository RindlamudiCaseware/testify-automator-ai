import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import IconNav from "./icons";
import ImageDragDrop from "./imagehandles";

const Module = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [userStory , setUserStory] = useState(["", ""])
  const [url, setUrl] = useState("");
  const [inputType, setInputType] = useState("file");

  const [userStoriesInput, setUserStoriesInput] = useState("");
  const [userStoriesPrompt , setUserStoriesPrompt] = useState("");

  const [fullTestData, setFullTestData] = useState(null);
  const [loadingIngestion, setLoadingIngestion] = useState(false);
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const [error, setError] = useState("");
  const [testCases, setTestCases] = useState([]);

  // icon indication
  const [ingestionSuccess, setIngestionSuccess] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [enrichmentSuccess, setEnrichmentSuccess] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);

  const [ingestionError, setIngestionError] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState(false);
  const [executionError, setExecutionError] = useState(false);



  const [testCasesGeneratedFromStory, setTestCasesGeneratedFromStory] = useState(null);

  const [executionResult, setExecutionResult] = useState(null);
  const [loadingExecution, setLoadingExecution] = useState(false);

  const [loadingEnrich, setLoadingEnrich] = useState(false);


  const MAX_FILES = 20;

  const handleUserStoryChange = (e) => setUserStory(e.target.value);
  const handleUrlChange = (e) => setUrl(e.target.value);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleContinue = async () => {
    setLoadingIngestion(true);
    setError("");
    setIngestionSuccess(false); // 🔁 Reset before start
    setIngestionError(false);   // 🔁 Reset before start

    if (selectedFiles.length === 0) {
      toast("Please upload at least one file.");
      setLoadingIngestion(false);
      return;
    }

    // 🔽 Log order of selected files
    console.log("📤 Uploading images in the following order:");
    selectedFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
    });

    const formData = new FormData();

    selectedFiles.forEach((file, index) => {
      formData.append("images", file);
      formData.append("orders", index + 1);
    });

    try {
      const response = await axios.post(
        "http://localhost:8001/upload-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        toast.success("✅ OCR extracted and stored in ChromaDB successfully.");
        setIngestionSuccess(true);   // ✅ Mark success
        setIngestionError(false);    // ✅ Ensure error is false
        setInputType("userStory");
      }
    } catch (error) {
      console.error("❌ Error uploading files:", error);
      toast.error(`Error uploading files: ${error?.message || "Please try again."}`);
      setIngestionError(true);      // ❌ Mark error
      setIngestionSuccess(false);   // ❌ Ensure success is false
    } finally {
      setLoadingIngestion(false);
    }
  };

  // for fetching testcases based on story
  const fetchTestCases = async () => {
    if (!userStoriesInput || userStoriesInput.trim() === "") {
      setError("Please enter at least one user story.");
      return;
    }

    try {
      setLoadingGeneration(true);
      setError("");
      setGenerationSuccess(false); // 🔁 Reset before starting
      setGenerationError(false);   // 🔁 Reset before starting

      const stories = userStoriesInput
        .split("|")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (stories.length === 0) {
        setError("Please enter at least one valid user story separated by | ");
        setLoadingGeneration(false);
        return;
      }

      const response = await axios.post("http://localhost:8001/rag/generate-from-story", {
        prompt: userStoriesPrompt,
        user_story: stories,
      });

      setTestCasesGeneratedFromStory(response.data.results);
      toast.success("Test cases generated successfully.");
      setInputType("url");
      setGenerationSuccess(true);  // ✅ Set success
      setGenerationError(false);   // ✅ Ensure error is off
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error generating test cases.");
      setGenerationError(true);    // ❌ Set error
      setGenerationSuccess(false); // ❌ Ensure success is off
    } finally {
      setLoadingGeneration(false);
    }

    console.log("Prompt:", userStoriesPrompt);
    console.log("User Stories:", userStoriesInput);
  };


  // for enriching locaters by URL
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

    // 🔁 Reset all related states before starting
    setLoadingEnrich(true);
    setError("");
    setTestCases([]);
    setFullTestData(null);
    setEnrichmentSuccess(false);
    setEnrichmentError(false);

    try {
      const response = await axios.post("http://localhost:8001/launch-browser", {
        url: url  // ✅ Key should match backend expectation
      });

      const data = response.data;
      setFullTestData(data);

      // ✅ Mark success, ensure error is false
      setEnrichmentSuccess(true);
      setEnrichmentError(false);
      toast.success("Locators enriched successfully");
    } catch (err) {
      // ❌ On failure, mark only error
      setError(err.response?.data?.message || "Error enriching locators");
      setEnrichmentError(true);
      setEnrichmentSuccess(false);
    } finally {
      setLoadingEnrich(false);
    }
  };


//  for test execution by test cases generated and by URL
  const executeStoryTest = async () => {
    setLoadingExecution(true); // 👈 use separate loader
    setError("");
    setExecutionResult(null);

    try {
      const response = await axios.post("http://localhost:8001/rag/run-generated-story-test");
      setExecutionResult(response.data);
      toast.success("Execution successfull.");
      setExecutionSuccess(true); 
    } catch (err) {
      setError(err.response?.data?.message || "Error executing story test.");
      setExecutionError(true); // after execution
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

        {/* display Icons */}
        <div>
            <IconNav
              ingestionSuccess={ingestionSuccess}
              ingestionError={ingestionError}
              generationSuccess={generationSuccess}
              generationError={generationError}
              enrichmentSuccess={enrichmentSuccess}
              enrichmentError={enrichmentError}
              executionSuccess={executionSuccess}
              executionError={executionError}
            />

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
                  <div
                    className="p-4 text-center"
                    style={{
                      border: "2px dashed #d6d8e1",
                      borderRadius: "5px",
                      backgroundColor: "#fafbfe",
                      cursor: "pointer",
                    }}
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
                    <i
                      className="bi bi-cloud-arrow-up"
                      style={{ fontSize: "45px", color: "#7857FF" }}
                    ></i>
                    <h6 style={{ color: "#8b6ffe" }}>Upload your Test Data</h6>
                    <p>Drag & drop your files here or click to browse</p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={async (e) => {
                        const inputFiles = Array.from(e.target.files);
                        let newFiles = [];

                        for (const file of inputFiles) {
                          if (file.type.startsWith("image/")) {
                            newFiles.push(file);
                          } else if (file.name.endsWith(".zip")) {
                            try {
                              const JSZip = (await import("jszip")).default;
                              const zip = await JSZip.loadAsync(file);
                              for (const zipEntry of Object.values(zip.files)) {
                                if (
                                  !zipEntry.dir &&
                                  /\.(jpe?g|png|gif|bmp|webp)$/i.test(zipEntry.name)
                                ) {
                                  const blob = await zipEntry.async("blob");
                                  const imageFile = new File([blob], zipEntry.name, {
                                    type: blob.type,
                                  });
                                  newFiles.push(imageFile);
                                }
                              }
                            } catch (err) {
                              toast.error("Failed to extract ZIP file.");
                            }
                          } else {
                            toast.warn(`${file.name} is not a valid image or ZIP file.`);
                          }
                        }

                        if (selectedFiles.length + newFiles.length > MAX_FILES) {
                          toast.error(`Maximum ${MAX_FILES} files allowed.`);
                          return;
                        }

                        setSelectedFiles((prev) => [...prev, ...newFiles]);
                      }}
                      style={{ display: "none" }}
                    />

                  </div>

                  {selectedFiles.length > 0 && (
                    <ImageDragDrop files={selectedFiles} setFiles={setSelectedFiles} />
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
                        <div
                          className="spinner-border spinner-border-sm text-light"
                          role="status"
                          style={{ width: "20px", height: "20px" }}
                        />
                      ) : (
                        "Upload Files"
                      )}
                    </button>
                  </div>
                </>
              )}

              {inputType === "userStory" && (
                <div>

                  <h5 className="mb-3">Enter prompt </h5>
                  <textarea
                    placeholder={`Enter Prompt...`}
                    onChange={(e) => setUserStoriesPrompt(e.target.value)}
                    value={userStoriesPrompt}
                    className="form-control"
                    style={{ minHeight: "100px", backgroundColor: "#f8f9fc" }}
                  ></textarea>

                  <h5 className="mb-3">Enter one or multiple user stories separated by | </h5>
                  <textarea
                    placeholder={`Enter user story 1 |  user story 2 | user.....`}
                    onChange={(e) => setUserStoriesInput(e.target.value)}
                    value={userStoriesInput}
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
                        <div
                          className="spinner-border spinner-border-sm text-light"
                          role="status"
                          style={{ width: "20px", height: "20px" }}
                        />
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

            {/* story test cases display */}
            {Array.isArray(testCasesGeneratedFromStory) && testCasesGeneratedFromStory.map((tc, idx) => (            
                <div key={idx}
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  backgroundColor: "#fafafa",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                <h4 style={{ marginBottom: "15px", color: "#333" }}>
                  Generated Test Case : {idx + 1}
                </h4>
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
                        {tc.manual_testcase}
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
                        {tc.auto_testcase}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}


            {/* Test Case Table */}
            {fullTestData && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ color: "#333",fontSize:"25px", margin: "10px" }}>
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
