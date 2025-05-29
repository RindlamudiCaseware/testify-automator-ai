import React from "react";
import {
  FaUpload,
  FaMagic,
  FaDatabase,
  FaCode,
  FaPlay,
} from "react-icons/fa";

const iconRoutes = [
  { icon: <FaUpload />, label: "Data Ingestion" },
  { icon: <FaMagic />, label: "Test Generation" },
  { icon: <FaPlay />, label: "Enriching Database" },
  { icon: <FaCode />, label: "Test Execution" },
];

const IconNav = () => {
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
        <div
          key={index}
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
              backgroundColor: "#f0f0f0",
              padding: "15px",
              borderRadius: "50%",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "60px",
              height: "60px",
            }}
          >
            {item.icon}
          </div>
          <span style={{ fontSize: "14px" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default IconNav;
