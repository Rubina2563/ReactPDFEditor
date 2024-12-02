import React from "react";
import PDFEditor from "./components/PDFEditor/PDFEditor";
import "./styles/global.css";

const App = () => {
  return (
    <div>
      <h1 className='text-center'>PDF Editor</h1>
      <PDFEditor />
    </div>
  );
};

export default App;
