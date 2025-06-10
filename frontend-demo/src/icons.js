import React from "react";
import {
  FaUpload,
  FaMagic,
  FaPlay,
  FaCode,
  FaArrowRight,
} from "react-icons/fa";

const IconNav = ({
  ingestionSuccess,
  ingestionError,
  generationSuccess,
  generationError,
  enrichmentSuccess,
  enrichmentError,
  executionSuccess,
  executionError,
}) => {
  const iconRoutes = [
    { icon: <FaUpload />, label: "Data Ingestion", success: ingestionSuccess, error: ingestionError },
    { icon: <FaMagic />, label: "Test Generation", success: generationSuccess, error: generationError },
    { icon: <FaPlay />, label: "Enriching Database", success: enrichmentSuccess, error: enrichmentError },
    { icon: <FaCode />, label: "Test Execution", success: executionSuccess, error: executionError },
  ];

  // Helper to get colors based on success/error
  const getColors = (success, error) => {
    if (error) return { bg: "#E74444", color: "#fff" };       // red bg, white icon
    if (success) return { bg: "#7857FF", color: "#fff" };     // green bg, white icon
    return { bg: "#f0f0f0", color: "grey" };                  // default light gray bg and grey icon
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        padding: "20px 10px",
        backgroundColor: "#f9f9fb",
        flexWrap: "wrap",
      }}
    >
      {iconRoutes.map((item, index) => {
        const { bg, color } = getColors(item.success, item.error);
        return (
          <React.Fragment key={index}>
            <div
              style={{
                textDecoration: "none",
                color: "grey",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                margin: "10px 20px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  backgroundColor: bg,
                  color: color,
                  padding: "15px",
                  borderRadius: "50%",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "60px",
                  height: "60px",
                  transition: "background-color 0.3s, color 0.3s",
                  boxShadow:
                    item.error
                      ? "#fa0714"
                      : item.success
                      ? "#7857FF"
                      : "none",
                  cursor: "default",
                  userSelect: "none",
                }}
              >
                {item.icon}
              </div>
              <span style={{ fontSize: "14px", color: "#555" }}>{item.label}</span>
            </div>

            {/* Show arrow between icons */}
            {index !== iconRoutes.length - 1 && (
              <FaArrowRight
                style={{
                  color: (item.success && !item.error) ? "#27AE60" : "#d1d8e3",
                  fontSize: "25px",
                  width: "40px",
                  margin: "0 10px",
                  transition: "color 0.3s",
                  userSelect: "none",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default IconNav;
