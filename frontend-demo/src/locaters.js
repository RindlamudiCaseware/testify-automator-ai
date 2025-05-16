import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Locaters = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div>
        <p>No data found. Please upload or enter input first.</p>
        <button onClick={() => navigate("/")}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Test Case Results</h2>
      <pre>{JSON.stringify(state, null, 2)}</pre>

      <button onClick={() => navigate("/")}>Go Back</button>
    </div>
  );
};

export default Locaters;
