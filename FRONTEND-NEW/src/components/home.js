import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "./dashboard";
import { toast, ToastContainer } from "react-toastify";

const Home = () => {
  const navigate = useNavigate();

  const [showDialog, setShowDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("Playwright");
  const [language, setLanguage] = useState("python");

  const handleStartProject = () => {
    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    console.log("Project Name:", projectName);
    console.log("Test Framework:", framework);
    console.log("Programming Language:", language);

    setShowDialog(false);
    navigate("/input");
  };


  return (
    <div style={{ backgroundColor: "#f1f7fe", minHeight: "100vh" }}>
      <ToastContainer/>
      <nav
        style={{
          backgroundColor: "#ffffff",
          minHeight: "8vh",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <i
            className="fa fa-code"
            style={{
              background:
                "linear-gradient(90deg,rgb(87, 72, 222),rgb(47, 28, 220),rgb(236, 7, 253))",
              color: "white",
              padding: "1rem",
              borderRadius: "20%",
              fontSize: "1rem",
            }}
          ></i>
          <div>
            <h4 style={{ margin: 0, fontSize: "clamp(20px, 2vw, 26px)" }}>
              AutoTest Studio
            </h4>
            <p style={{ margin: 0, fontSize: "clamp(14px, 1.5vw, 18px)", color: "#555" }}>
              Automation Development Platform
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDialog(true)}
          style={{
            padding: "0.9rem 2rem",
            background:
              "linear-gradient(90deg,rgb(76, 62, 203),rgb(87, 72, 222),rgb(227, 83, 237))",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "clamp(16px, 1.5vw, 18px)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <i className="fa-solid fa-plus" style={{ fontSize: "18px" }}></i>
          New Project
        </button>
      </nav>

      <Dashboard />

      {/* Project Setup Dialog */}
      {showDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "10px",
              padding: "2rem",
              width: "90%",
              maxWidth: "450px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ marginBottom: "1.5rem" }}>Create New Project</h2>

            <label style={{ display: "block", marginBottom: "10px" }}>
              Project Name:
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  marginTop: "6px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "10px" }}>
              Select Framework:
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  marginTop: "6px",
                }}
              >
                <option>Selenium </option>
                <option>Playwright</option>
                <option>Cypress </option>
                <option>Appium </option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "1.5rem" }}>
              Programming Language:
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  marginTop: "6px",
                }}
              >
                <option>Java</option>
                <option>Python</option>
                <option>JavaScript</option>
                <option>C#</option>
              </select>
            </label>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setShowDialog(false)}
                style={{
                  padding: "0.6rem 1.4rem",
                  background: "gray",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleStartProject}
                style={{
                  padding: "0.6rem 1.4rem",
                  background: "linear-gradient(to right, #4c3ecb, #e353ed)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                Start Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
