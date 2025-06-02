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
  generationSuccess,
  enrichmentSuccess,
  executionSuccess,
}) => {
  const iconRoutes = [
    { icon: <FaUpload />, label: "Data Ingestion", active: ingestionSuccess },
    { icon: <FaMagic />, label: "Test Generation", active: generationSuccess },
    { icon: <FaPlay />, label: "Enriching Database", active: enrichmentSuccess },
    { icon: <FaCode />, label: "Test Execution", active: executionSuccess },
  ];

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
      {iconRoutes.map((item, index) => (
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
                backgroundColor: item.active ? "#7857FF" : "#f0f0f0",
                color: item.active ? "#fff" : "grey",
                padding: "15px",
                borderRadius: "50%",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "60px",
                height: "60px",
                transition: "background-color 0.3s, color 0.3s",
              }}
            >
              {item.icon}
            </div>
            <span style={{ fontSize: "14px" }}>{item.label}</span>
          </div>

          {/* Show green arrow if current step is active */}
          {index !== iconRoutes.length - 1 && (
            <FaArrowRight
              style={{
                color: item.active ? "#7857FF" : "#d1d8e3",
                fontSize: "25px",
                width: "40px",
                margin: "0 10px",
                transition: "color 0.3s",
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default IconNav;
