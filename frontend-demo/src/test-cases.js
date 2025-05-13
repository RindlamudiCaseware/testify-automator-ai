import React from "react";
import { useLocation } from "react-router-dom";

const TestCases = () => {
    const location = useLocation();
    const data = location.state?.data;

    return (
        <div className="container mt-5"> 
            <h2>AI-Based Test Case Generation</h2> 
            <p> Our AI analyzes your ChromaDB data and generates comprehensive test cases. </p> 
            <h3> Generated TestCases </h3> 
            <pre>{JSON.stringify(data, null, 2)}</pre> 
        </div>
    );
};

export default TestCases;