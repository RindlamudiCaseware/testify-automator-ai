// App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import Module from "./module";
import TestCases from "./test-cases";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Module />} />
      <Route path="/test-cases" element={<TestCases />} />
    </Routes>
  );
};

export default App;
