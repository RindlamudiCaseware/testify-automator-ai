// App.js
import React from "react";
import { Routes, Route ,Router} from "react-router-dom";

import Module from "./module";
import Locaters from "./locaters";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Module />} />
      <Route path="/locaters" element={<Locaters />} />
    </Routes>
  );
};

export default App;
