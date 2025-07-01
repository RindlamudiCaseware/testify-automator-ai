import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ImageDragDrop from "./imagehandles"; // adjust path if needed

const ImageUpload = ({ handleNext, persistedFiles, setPersistedFiles }) => {
  const [loadingIngestion, setLoadingIngestion] = useState(false);
  const [ingestionSuccess, setIngestionSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pageNames, setPageNames] = useState([]);

  const selectedFiles = persistedFiles;
  const setSelectedFiles = setPersistedFiles;

  const handleFileChange = async (e) => {
    const inputFiles = Array.from(e.target.files);
    let allProcessedFiles = [];

    for (const file of inputFiles) {
      if (file.type.startsWith("image/")) {
        const previewFile = new File([file], file.name, { type: file.type });
        previewFile.preview = URL.createObjectURL(previewFile);
        allProcessedFiles.push(previewFile);
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
              imageFile.preview = URL.createObjectURL(imageFile);
              allProcessedFiles.push(imageFile);
            }
          }
        } catch (err) {
          toast.error("Failed to extract ZIP file.");
        }
      } else {
        toast.warn(`${file.name} is not a valid image or ZIP file.`);
      }
    }

    setSelectedFiles((prev) => [...prev, ...allProcessedFiles]);
  };

  const handleContinue = async () => {
    setLoadingIngestion(true);
    setError("");
    setIngestionSuccess(false);

    if (selectedFiles.length === 0) {
      toast.warn("Please upload at least one file.");
      setLoadingIngestion(false);
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    const orderedImageNames = selectedFiles.map((file) => file.name);
    formData.append("ordered_images", JSON.stringify({ ordered_images: orderedImageNames }));

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
        toast.success("OCR extracted and stored in ChromaDB successfully.");
        setIngestionSuccess(true);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setError(error?.message || "Please try again.");
      toast.error(`Error uploading files: ${error?.message || "Please try again."}`);
    } finally {
      setLoadingIngestion(false);
    }
  };

  const handleGenerateMethods = async () => {
    try {
      const response = await fetch("http://localhost:8001/rag/generate-page-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      const names = Object.keys(data);
      setPageNames(names);
      toast.success("Successfully generated methods");
    } catch (error) {
      console.error("Error fetching page methods:", error);
      setPageNames([]);
      toast.error("Error generating methods");
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
        <h2 style={{ fontSize: "22px", color: "#333" }}>Upload Designs</h2>
        <p style={{ fontSize: "18px", color: "#555", marginBottom: "20px" }}>
          Upload screenshots or visual designs of your application
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed #d6d8e1",
            padding: "1rem",
            borderRadius: "10px",
            transition: "all 0.3s ease",
          }}
        >
          <input
            id="file-upload"
            type="file"
            accept="image/*,.zip"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <i
            className="fa-solid fa-cloud-arrow-up"
            style={{ fontSize: "40px", marginBottom: "10px" }}
          ></i>

          <h3 style={{ fontSize: "18px", color: "black", margin: "0" }}>
            Upload Design Files
          </h3>

          <p
            style={{
              color: "#666",
              fontSize: "18px",
              marginTop: "8px",
              marginBottom: "16px",
            }}
          >
            Click the button below to select your files
          </p>

          <button
            onClick={() => document.getElementById("file-upload").click()}
            style={{
              padding: "14px 30px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid grey",
              backgroundColor: "white",
            }}
          >
            <i className="fa-solid fa-upload" style={{ fontSize: "16px" }}></i>
            <span style={{ fontSize: "18px" }}>Select Files</span>
          </button>
        </div>

        {selectedFiles.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <ImageDragDrop files={selectedFiles} setFiles={setSelectedFiles} />
          </div>
        )}

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

        {ingestionSuccess && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px 16px",
              backgroundColor: "#e6ffed",
              color: "#027a48",
              border: "1.5px solid #b7eb8f",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ✅ Success
          </div>
        )}

        {pageNames.length > 0 && (
          <div className="mt-4 p-4 border rounded shadow-sm bg-light">
            <h5 className="mb-3" style={{ color: "black" }}>Available Pages:</h5>
            <ul className="list-group">
              {pageNames.map((name, idx) => (
                <li
                  key={idx}
                  className="list-group-item d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "white",
                    borderRadius: "4px",
                    marginBottom: "6px",
                    padding: "8px 12px",
                    fontWeight: "500",
                    color: "#333",
                    border: "1px solid #dee2e6",
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "30px",
            gap: "10px",
          }}
        >
          <button
            onClick={handleContinue}
            disabled={loadingIngestion}
            style={{
              padding: "0.7rem 2rem",
              fontSize: "20px",
              color: "white",
              border: "0px",
              background:
                "linear-gradient(90deg,rgb(76, 62, 203),rgb(106, 92, 227),rgb(216, 148, 221))",
              borderRadius: "5px",
              cursor: "pointer",
              opacity: loadingIngestion ? 0.6 : 1,
            }}
          >
            {loadingIngestion ? "Uploading..." : "Upload Images"}
          </button>

          <button
            onClick={handleGenerateMethods}
            style={{
              padding: "0.7rem 2rem",
              fontSize: "20px",
              color: "white",
              border: "0px",
              background:
                "linear-gradient(90deg,rgb(76, 62, 203),rgb(106, 92, 227),rgb(216, 148, 221))",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Generate Page Methods
          </button>
        </div>
      </div>

      <div
        style={{
          width: "70vw",
          marginTop: "20px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={handleNext}
          style={{
            padding: "0.7rem 3rem",
            fontSize: "20px",
            color: "white",
            border: "0px",
            background: "grey",
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          Next <i className="fa-solid fa-angle-right"></i>
        </button>
      </div>
    </div>
  );
};

export default ImageUpload;
