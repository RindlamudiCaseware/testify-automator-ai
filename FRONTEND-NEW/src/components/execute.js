import React from "react";

const Execute = ({ onBack, fullTestData }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f2f7fe",
        paddingTop: "2rem",
        paddingBottom: "30px",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "1200px",
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
          padding: "2rem 2.5rem",
        }}
      >
        {/* Heading Section */}
        <h3 style={{ fontSize: "22px", marginBottom: "0.5rem" }}>
          <i className="fa-solid fa-code" style={{ color: "blue", marginRight: "10px" }}></i>
          Generate Scripts
        </h3>
        <p style={{ fontSize: "17px", color: "gray" }}>
          Configure framework and generate test scripts
        </p>

        {/* Icon & Description */}
        <div style={{ textAlign: "center", marginTop: "2rem", marginBottom: "2rem" }}>
          <div style={{ fontSize: "45px", color: "blue" }}>
            <i className="fa-solid fa-code"></i>
          </div>
          <h2 style={{ margin: "0.5rem 0" }}>Generate Test Scripts</h2>
          <p style={{ color: "gray", fontSize: "17px" }}>
            Your test scripts will be generated based on the uploaded designs and user stories.
          </p>
        </div>

        {/* Two-Column Responsive Layout */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "2rem",
            justifyContent: "space-between",
          }}
        >
          {/* Project Summary Card */}
          <div
            style={{
              flex: "1 1 300px",
              border: "1px solid #e0e0e0",
              borderRadius: "10px",
              padding: "1.5rem",
              backgroundColor: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                fontSize: "22px",
                marginBottom: "1.5rem",
                fontWeight: "600",
                color: "#212121",
                borderBottom: "1px solid #e0e0e0",
                paddingBottom: "0.5rem",
              }}
            >
              Project Summary
            </h3>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16.5px",
                marginBottom: "1rem",
                color: "#444",
              }}
            >
              <span>Design Files:</span>
              <strong style={{ color: "#000" }}>0</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16.5px",
                marginBottom: "1rem",
                color: "#444",
              }}
            >
              <span>User Stories:</span>
              <strong style={{ color: "#000" }}>0</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16.5px",
                color: "#444",
              }}
            >
              <span>Selected Framework:</span>
              <strong style={{ color: "#000" }}>Selenium (Web)</strong>
            </div>
          </div>

          {/* Generation Settings Card */}
          <div
            style={{
              flex: "1 1 300px",
              border: "1px solid #e0e0e0",
              borderRadius: "10px",
              padding: "1.5rem",
              backgroundColor: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            <h3
              style={{
                fontSize: "22px",
                marginBottom: "1.5rem",
                fontWeight: "600",
                color: "#212121",
                borderBottom: "1px solid #ddd",
                paddingBottom: "10px",
              }}
            >
              Test Generation Settings
            </h3>

            <div style={{ marginBottom: "1.8rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  color: "#333",
                }}
              >
                Select Test Framework
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "15px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                  transition: "border 0.2s ease",
                }}
              >
                <option>Selenium (Web)</option>
                <option>Playwright (Web)</option>
                <option>Cypress (Web)</option>
                <option>Appium (Mobile)</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  color: "#333",
                }}
              >
                Choose Programming Language
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "15px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                  transition: "border 0.2s ease",
                }}
              >
                <option>Java</option>
                <option>Python</option>
                <option>JavaScript</option>
                <option>C#</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div
        style={{
          width: "90%",
          maxWidth: "1200px",
          marginTop: "20px",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "0.7rem 2rem",
            fontSize: "17px",
            background: "lightgray",
            color: "black",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          <i className="fa-solid fa-angle-left" style={{ marginRight: "10px" }}></i>
          Back
        </button>
      </div>
    </div>
  );
};

export default Execute;
    