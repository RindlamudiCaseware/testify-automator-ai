import React, { useRef } from "react";

const ImageDragDrop = ({ files, setFiles }) => {
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (index) => (dragItem.current = index);
  const handleDragEnter = (index) => (dragOverItem.current = index);
  const handleDragEnd = () => {
    const newList = [...files];
    const dragged = newList[dragItem.current];
    newList.splice(dragItem.current, 1);
    newList.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setFiles(newList);
  };

  const removeImage = (index) => {
    const newFiles = [...files];
    if (newFiles[index]?.preview) {
      URL.revokeObjectURL(newFiles[index].preview);
    }
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
      {files.map((file, idx) => (
        <div
          key={file.name + idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragEnter={() => handleDragEnter(idx)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          style={{ width: "200px", height: "160px", position: "relative", backgroundColor: "#fafbfe", borderRadius: "8px", boxShadow: "0 0 4px #ccc", overflow: "hidden" }}
        >
          <img src={file.preview} alt={file.name} style={{ width: "100%", height: "120px", objectFit: "cover" }} />
          <div style={{ padding: "5px", fontSize: "14px", textAlign: "center", color: "#333" }}>{file.name}</div>

          {/* Index */}
          <div style={{ position: "absolute", top: "6px", left: "6px", backgroundColor: "#7857FF", color: "white", padding: "2px 7px", fontSize: "12px", borderRadius: "12px", fontWeight: "600" }}>{idx + 1}</div>

          {/* Remove */}
          <button onClick={() => removeImage(idx)} style={{ position: "absolute", top: "6px", right: "6px", backgroundColor: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", color: "white", width: "22px", height: "22px", cursor: "pointer", fontWeight: "bold" }}>×</button>
        </div>
      ))}
    </div>
  );
};

export default ImageDragDrop;
