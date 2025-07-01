import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const URLInput = ({ onBack, onNext }) => {
  const [url, setUrl] = useState("");
  const [fullTestData, setFullTestData] = useState(null);
  const [loadingEnrich, setLoadingEnrich] = useState(false);
  const [error, setError] = useState("");

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
    setFullTestData(null);

    try {
      const response = await axios.post("http://localhost:8001/launch-browser", {
        url: url
      });

      const data = response.data;
      setFullTestData(data);
      toast.success("Locators enriched successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Error enriching locators");
    } finally {
      setLoadingEnrich(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "70vh",
        backgroundColor: "#f2f7fe",
        paddingTop: "2rem",
        paddingBottom: "30px",
      }}
    >
      <div
        style={{
          padding: "1rem 3rem",
          border: "1px solid #ccc",
          minHeight: "45vh",
          width: "70vw",
          backgroundColor: "white",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h3 style={{ fontSize: "30px" }}>Enter URL</h3>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste your app URL here..."
          style={{
            padding: "1rem",
            fontSize: "16px",
            width: "100%",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginTop: "10px",
          }}
        />
        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "30px",
          }}
        >
          <button
            onClick={enrichLocaters}
            style={{
              padding: "0.7rem 2rem",
              fontSize: "18px",
              background: "linear-gradient(90deg, #4c3ecb, #5748de, #e353ed)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {loadingEnrich ? "Enriching..." : "Enrich Locaters"}
          </button>
        </div>

        {fullTestData && (
          <div
            style={{
              marginTop: "30px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "20px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h3
              style={{
                color: "#333",
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "15px",
                borderBottom: "1px solid #ddd",
                paddingBottom: "6px",
              }}
            >
              Test Case JSON Output :
            </h3>
            <pre
              style={{
                backgroundColor: "#1e1e1e",
                color: "#00ff00",
                padding: "15px",
                borderRadius: "8px",
                fontSize: "13px",
                lineHeight: "1.6",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(fullTestData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div
        style={{
          width: "70vw",
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "0.7rem 2rem",
            fontSize: "18px",
            background: "lightgray",
            color: "black",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          <i className="fa-solid fa-angle-left" style={{ marginRight: "10px" }}></i>
          Previous
        </button>

        <button
          onClick={onNext}
          style={{
            padding: "0.7rem 2rem",
            fontSize: "18px",
            backgroundColor: "lightgray",
            color: "black",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Next <i className="fa-solid fa-angle-right" style={{ marginLeft: "10px" }}></i>
        </button>
      </div>
    </div>
  );
};

export default URLInput;
