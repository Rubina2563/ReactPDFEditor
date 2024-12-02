import React, { useState, useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom"; // Import the zoomPlugin
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css"; // Import styles for zoom plugin

const PDFViewer = ({ file }) => {
  const [fileUrl, setFileUrl] = useState(null);

  // Initialize the zoomPlugin
  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;

  useEffect(() => {
    if (file) {
      // When a new file is passed as a prop, create a URL for the file
      const newFileUrl = URL.createObjectURL(file);
      setFileUrl(newFileUrl);  // Update the fileUrl state
    }
  }, [file]);

  return (
    <div style={{ padding: "20px" }}>
      {/* Zoom Controls */}
      <div
        style={{
          alignItems: "center",
          backgroundColor: "#eeeeee",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          display: "flex",
          justifyContent: "center",
          padding: "4px",
        }}
      >
        {/* Zoom In and Zoom Out buttons using the zoomPlugin's components */}
        <ZoomOutButton />
        <ZoomPopover />
        <ZoomInButton />
      </div>

      {/* PDF Viewer or the "Please select a file" message */}
      <div style={{ marginTop: "20px", flex: 1, overflow: "hidden" }}>
        {fileUrl ? (
          // If the file URL is created, show the PDF Viewer
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              fileUrl={fileUrl}
              plugins={[zoomPluginInstance]} // Use zoomPlugin here
            />
          </Worker>
        ) : (
          // If no file URL is available, show the message
          <p>Please select a PDF file to view</p>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
