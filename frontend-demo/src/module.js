import React, { useState } from "react";
import { ToastContainer , toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Module = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [userStory, setUserStory] = useState("");
    const [url, setUrl] = useState("");
    const [inputType, setInputType] = useState("file");

    const navigate = useNavigate();

    const MAX_FILES = 20;

    const handleFileUpload = (e) => {
        setSelectedFiles(e.target.files);
    };

    const handleUserStoryChange = (e) => {
        setUserStory(e.target.value);
    };

    const handleUrlChange = (e) => {
        setUrl(e.target.value);
    };

      const handleContinue = async () => {
    // Validation checks
        if (inputType === "file" && selectedFiles.length === 0) {
        toast("Please upload at least one file.");
        return;
        }

        if (inputType === "userStory" && userStory.trim() === "") {
        toast("Please enter a user story.");
        return;
        }

        if (inputType === "url") {
        if (url.trim() === "") {
            toast("Please enter a correct URL.");
            return;
        }
        try {
            new URL(url); // Validate URL
        } catch (_) {
            toast("Please enter a valid URL (e.g., https://example.com)");
            return;
        }
        }

        // Select appropriate API URL based on input type
        let apiUrl = "";
        const formData = new FormData();

        if (inputType === "file") {
        if (selectedFiles.length > 0) {
            Array.from(selectedFiles).forEach((file) => {
            formData.append("file", file);
            });
            apiUrl = "/api/generate-from-images"; // Image upload endpoint
        }
        } else if (inputType === "userStory") {
        formData.append("userStory", userStory);
        apiUrl = "/api/submit-story"; // User story endpoint
        } else if (inputType === "url") {
        formData.append("url", url);
        apiUrl = "/api/generate-from-url"; // URL submission endpoint
        }

        try {
        // Send data to the appropriate API via Axios
        const response = await axios.post(apiUrl, formData, {
            headers: {
            "Content-Type": "multipart/form-data", // For file upload, or use 'application/json' for others
            },
        });

        if (response.status === 200) {
            toast.success("Data sent successfully.");
            navigate("/test-cases"); // Navigate to TestCases page after successful submission
        }
        } catch (error) {
        console.error("Error sending data to the API:", error);
        toast.error("There was an error sending the data.");
        }
    };

    return (
        <div
            className="container-fluid p-0"
            style={{ backgroundColor: "#f8f9fc", height: "cover", minHeight: "100vh" }}
        >
            <ToastContainer/>
            <div className="row m-0">
                <div
                    className="col-12"
                    style={{ backgroundColor: "#efedfc", height: "80px" }}
                >
                    <div className="d-flex justify-content-between align-items-center h-100 px-4">
                        <h3
                            style={{
                                color: "#8b6ffe",
                                fontFamily: "Segoe UI",
                                fontWeight: "bold",
                                fontSize: "30px",
                                margin: 0
                            }}
                        >
                            Testify
                        </h3>
                        <div className="d-flex gap-3">
                            <p className="mb-0">Docs</p>
                            <p className="mb-0">Support</p>
                        </div>
                    </div>
                </div>
                <div className="col-xl-12 m-5 mt-2">
                    <h1
                        style={{
                            color: "#8b6ffe",
                            fontFamily: "Segoe UI",
                            fontWeight: "bold",
                            fontSize: "28px",
                            marginTop: "30px"
                        }}
                    >
                        AI-Powered Test Automation
                    </h1>
                    <p style={{ fontFamily: "Segoe UI", fontSize: "16px" }}>
                        Create, store, execute, and analyze automated tests with the power of AI.
                    </p>
                </div>

                <div
                    className="col-xl-12 m-5 mt-0"
                    style={{
                        backgroundColor: "white",
                        border: "1px solid #f8f8fb",
                        borderRadius: "5px",
                        width: "92vw",
                        minHeight: "55vh"
                    }}
                >
                    <div className="m-4" style={{ fontFamily: "Segoe UI" }}>
                        <h4 style={{ fontSize: "25px" }}>Data Ingestion</h4>
                        <p style={{ fontSize: "16px", color: "#bbbfc6" }}>
                            Provide test requirements through document uploads, user stories, or a web
                            application URL.
                        </p>

                        <div>
                            <button
                                className="btn btn-light me-4"
                                onClick={() => setInputType("file")}
                            >
                                Upload files
                            </button>
                            <button
                                className="btn btn-light me-4"
                                onClick={() => setInputType("userStory")}
                            >
                                Enter User Story
                            </button>
                            <button
                                className="btn btn-light"
                                onClick={() => setInputType("url")}
                            >
                                Enter URL
                            </button>
                        </div>

                        <div>
                            <hr />
                        </div>

                        <div
                            style={{
                                border: "2px solid #f6f6f8",
                                borderRadius: "5px",
                                marginTop: "2px",
                                minHeight: "20vh",
                                padding:"20px",                                
                            }}
                        >
                            <div
                        
                    >
                        <div style={{ marginTop: "10px" }}>
                            {inputType === "file" && (
                                    <>
                                        <div
                                            className="p-4 text-center"
                                            style={{
                                                border: "2px dashed #d6d8e1",
                                                borderRadius: "5px",
                                                backgroundColor: "#fafbfe",
                                                position: "relative",
                                                cursor: "pointer",
                                            }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDragEnter={(e) => e.preventDefault()}
                                            onDragLeave={(e) => e.preventDefault()}
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
                                            <div style={{ color: "#8b6ffe", fontWeight: "bold", fontSize: "30px" }}>
                                                <i className="bi bi-upload"></i>
                                            </div>
                                            <div style={{ color: "#8b6ffe", fontWeight: "bold", fontSize: "30px" }}>
                                                <h6> Upload your Test Data </h6>
                                            </div>
                                            <div style={{ color: "#999", fontSize: "14px", marginBottom: "10px" }}>
                                                 Drag & drop your files here or click to browse
                                            </div>
                                            <div style={{ color: "#999", fontSize: "14px", marginBottom: "10px" }}>
                                                Maximum 20 files, up to 20MB each 
                                            </div>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                multiple
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files);

                                                    if (selectedFiles.length + files.length > MAX_FILES) {
                                                        toast.error(`Maximum ${MAX_FILES} files allowed.`);
                                                        return;
                                                    }

                                                    setSelectedFiles((prev) => [...prev, ...files]);
                                                }}
                                                style={{ display: "none" }}
                                            />
                                        </div>

                                        {/* File Preview */}
                                        {selectedFiles.length > 0 && (
                                            <div className="row mt-4">
                                                {selectedFiles.map((file, index) => {
                                                    const isImage = file.type.startsWith("image/");
                                                    const url = isImage ? URL.createObjectURL(file) : null;

                                                    return (
                                                        <div key={index} className="col-3 mb-3 position-relative">
                                                            <div className="card shadow-sm">
                                                                {isImage ? (
                                                                    <img
                                                                        src={url}
                                                                        alt={file.name}
                                                                        className="card-img-top"
                                                                        style={{
                                                                            height: "150px",
                                                                            objectFit: "cover",
                                                                            borderTopLeftRadius: "0.5rem",
                                                                            borderTopRightRadius: "0.5rem",
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        className="d-flex align-items-center justify-content-center"
                                                                        style={{
                                                                            height: "150px",
                                                                            backgroundColor: "#f2f2f2",
                                                                            borderTopLeftRadius: "0.5rem",
                                                                            borderTopRightRadius: "0.5rem",
                                                                            fontSize: "24px",
                                                                            color: "#888",
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-file-earmark"></i>
                                                                    </div>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-light position-absolute"
                                                                    style={{ top: "5px", right: "5px", borderRadius: "50%" }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedFiles((prev) =>
                                                                            prev.filter((_, i) => i !== index)
                                                                        );
                                                                    }}
                                                                    title="Remove"
                                                                >
                                                                    ✕
                                                                </button>
                                                                <div className="card-body p-2">
                                                                    <p
                                                                        className="card-text text-truncate"
                                                                        title={file.name}
                                                                        style={{ fontSize: "14px" }}
                                                                    >
                                                                        {file.name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}

                            {inputType === "userStory" && (
                                <>
                                    <h5 style={{ marginTop: "10px" }}> Enter user story or requirements </h5>
                                    <textarea
                                        placeholder="Enter User Story"
                                        onChange={handleUserStoryChange}
                                        value={userStory}
                                        className="form-control"
                                        style={{
                                            border: "2px solid #f6f6f8",
                                            borderRadius: "5px",
                                            minHeight: "100px",
                                            marginTop: "10px",
                                            backgroundColor:"#f8f9fc",
                                        }}
                                    ></textarea>
                                </>
                            )}

                            {inputType === "url" && (
                                <>
                                    <h5 style={{ marginTop: "10px", fontWeight: "bold" }}>Enter Web Application URL</h5>
                                    <input
                                        type="url"
                                        placeholder="https://example.com "
                                        onChange={handleUrlChange}
                                        value={url}
                                        className="form-control"
                                        style={{
                                            border: "2px solid #f6f6f8",
                                            borderRadius: "5px",
                                            marginTop: "10px",
                                            backgroundColor:"#f8f9fc",
                                        }}
                                    />
                                </>
                            )}
                        </div>
                        
                        </div>
                        <div style={{textAlign:"end" , marginTop:"20px"}}> <button onClick={handleContinue} style={{backgroundColor:"#8b6ffe" , height:"42px" , width:"120px" , border:"none" , borderRadius:"10px" , color:"white"}}> Contniue </button></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Module;
