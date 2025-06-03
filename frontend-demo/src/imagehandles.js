import React, { useState, useRef } from "react";

const ImageDragDrop = ({ files, setFiles }) => {
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    const listCopy = [...files];
    const draggedItem = listCopy[dragItem.current];
    listCopy.splice(dragItem.current, 1);
    listCopy.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null;
    dragOverItem.current = null;
    setFiles(listCopy);
  };

  const removeImage = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      {files.map((file, idx) => {
        const url = URL.createObjectURL(file);
        return (
          <div
            key={file.name + idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            style={{
              marginTop:"15px",
              width: "200px",
              height: "160px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              position: "relative",
              backgroundColor: "#fafbfe",
              borderRadius: "8px",
              boxShadow: "0 0 4px #ccc",
              padding: "4px",
              cursor: "grab",
              overflow: "hidden",
            }}
          >
            <img
              src={url}
              alt={file.name}
              draggable={false}
              style={{
                width: "100%",
                height: "120px",
                objectFit: "cover",
                borderRadius: "6px",
              }}
            />
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color: "#444",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
              }}
              title={file.name}
            >
              {file.name}
            </div>

            {/* Index Badge */}
            <div
              style={{
                position: "absolute",
                top: "6px",
                left: "6px",
                backgroundColor: "#7857FF",
                color: "white",
                padding: "2px 7px",
                fontSize: "12px",
                borderRadius: "12px",
                fontWeight: "600",
                zIndex: 2,
              }}
            >
              {idx + 1}
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(idx);
              }}
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                backgroundColor: "rgba(0,0,0,0.6)",
                border: "none",
                borderRadius: "50%",
                color: "white",
                width: "22px",
                height: "22px",
                cursor: "pointer",
                fontWeight: "bold",
                lineHeight: "20px",
                zIndex: 2,
              }}
              title="Remove image"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ImageDragDrop;
