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

  // ✅ Original background color logic
  const getColors = (success, error) => {
    if (error) return { bg: "#E74444", color: "#fff" };       // red
    if (success) return { bg: "#7857FF", color: "#fff" };     // green/purple
    return { bg: "#f0f0f0", color: "grey" };                  // default gray
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        padding: "20px 10px",
        flexWrap: "wrap",
      }}
    >
      {iconRoutes.map((item, index) => {
        const { bg, color } = getColors(item.success, item.error);
        return (
          <React.Fragment key={index}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                margin: "10px 20px",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  backgroundColor: bg,
                  color: color,
                  padding: "16px",
                  borderRadius: "50%",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "65px",
                  height: "65px",
                  transition: "all 0.3s ease-in-out",
                  boxShadow:
                    item.error
                      ? "0 0 12px rgba(234, 13, 13, 0.96)"
                      : item.success
                      ? "0 0 12px rgba(120,87,255,0.5)"
                      : "none",
                }}
              >
                {item.icon}
              </div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#444",
                }}
              >
                {item.label}
              </span>
            </div>

            {index !== iconRoutes.length - 1 && (
              <FaArrowRight
                style={{
                  color: item.success && !item.error ? "#7857FF" : "#d1d8e3",
                  fontSize: "24px",
                  margin: "0 10px",
                  transition: "color 0.3s ease-in-out",
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
