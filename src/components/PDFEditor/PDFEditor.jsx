import React, { useState, useRef } from 'react';
import PDFViewer from './PDFViewer';
import PDFEditorCanvas from './PDFEditorCanvas';
import Toolbar from './Toolbar';
import { savePDF } from '../../utils/savePDF';

const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const canvasRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);  // Set the uploaded PDF file
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const handleSave = () => {
    if (canvasRef.current && pdfFile) {
      savePDF(canvasRef.current, pdfFile);
    } else {
      alert('No PDF or edits to save!');
    }
  };

  return (
    <div className="pdf-editor">
      <input type="file" accept="application/pdf" onChange={handleFileUpload} />
      {pdfFile && (
        <>
          <Toolbar canvasRef={canvasRef} onSave={handleSave} />
          {/* Pass the pdfFile directly to the PDFViewer component */}
          <PDFViewer file={pdfFile} />
          <PDFEditorCanvas canvasRef={canvasRef} />
        </>
      )}
    </div>
  );
};

export default PDFEditor;
