import React from "react";
import { useLocation } from "react-router-dom";

const TestCases = () => {
    const location = useLocation();
    const data = location.state?.data;

    return (
        <div className="container mt-5">
            <h2>Received Data</h2>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};

export default TestCases;