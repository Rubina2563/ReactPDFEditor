import React, { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import jsPDF from "jspdf";
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';


import "./PDFEditor.css";



const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // Track zoom level
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const actionStack = useRef([]); // For undo/redo
  const redoStack = useRef([]);
  const zoomPluginInstance = zoomPlugin({
    onZoom: (newZoomLevel) => {
      setZoomLevel(newZoomLevel); // Update zoom level
    },
  });
  const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };
const onPdfLoad = (e) => {
  setPdfLoaded(true);

  if (pdfFile && canvasRef.current) {
    // Assuming you have precomputed or extracted width and height
    const pageWidth = 600; // Replace with your logic to get page width
    const pageHeight = 800; // Replace with your logic to get page height

    // Update canvas dimensions
    canvasRef.current.width = pageWidth;
    canvasRef.current.height = pageHeight;

    const fabricCanvas = fabricCanvasRef.current;

    if (fabricCanvas) {
      fabricCanvas.setWidth(pageWidth);
      fabricCanvas.setHeight(pageHeight);
      fabricCanvas.renderAll();
    }
  }
};

useEffect(() => {
  if (pdfFile && canvasRef.current) {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      selection: true,
    });

    fabricCanvasRef.current = fabricCanvas;

    const renderPDFToCanvas = async (pdfFile) => {
      const reader = new FileReader();
      reader.onload = async () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

        const pdfData = new Uint8Array(reader.result);
        const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const page = await pdfDoc.getPage(1); // Render the first page

        const viewport = page.getViewport({ scale: 1.5 }); // Adjust the scale for better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the PDF page into the canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;

        // Convert the canvas to a data URL and load it as a background image in Fabric.js
        const imageDataUrl = canvas.toDataURL();
        fabric.Image.fromURL(imageDataUrl, (img) => {
          fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
        });
      };

      reader.readAsArrayBuffer(pdfFile);
    };

    renderPDFToCanvas(pdfFile);

    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }
}, [pdfFile]);



  useEffect(() => {
    if (fabricCanvasRef.current && pdfLoaded) {
      const fabricCanvas = fabricCanvasRef.current;

      // Adjust canvas size based on the loaded image (PDF converted to image)
      const pdfContainer = document.querySelector(".pdf-container");
      if (!pdfContainer) return;

      const pdfWidth = pdfContainer.offsetWidth;
      const pdfHeight = pdfContainer.offsetHeight;

      fabricCanvas.setWidth(pdfWidth * zoomLevel);
      fabricCanvas.setHeight(pdfHeight * zoomLevel);
      fabricCanvas.setZoom(zoomLevel);
      fabricCanvas.renderAll();
    }
  }, [zoomLevel, pdfLoaded]);


  const saveState = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      actionStack.current.push(fabricCanvas.toJSON());
      redoStack.current = []; // Clear redo stack on new action
    }
  };

  const resetDrawingMode = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      fabricCanvas.isDrawingMode = false; // Turn off drawing mode
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
    }
  };

  const handleAddText = () => {
    resetDrawingMode();
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const text = new fabric.Textbox("Enter Text Here", {
      left: 100 / zoomLevel, // Adjust coordinates based on zoom level
      top: 100 / zoomLevel,
      width: 200 / zoomLevel,
      fontSize: 16 / zoomLevel, // Scale font size with zoom
      fill: "black",
      scaleX: zoomLevel, // Scale object with zoom level
      scaleY: zoomLevel,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    saveState();
    fabricCanvas.renderAll();
  };

  const handlePencil = () => {
    resetDrawingMode();
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = true;
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.width = 2 / zoomLevel; // Adjust brush size for zoom
    fabricCanvas.freeDrawingBrush.color = "black";
  };

  const handleErase = () => {
    resetDrawingMode();
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = true;
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.color = "white";
    fabricCanvas.freeDrawingBrush.width = 20 / zoomLevel; // Adjust eraser size for zoom
  };

const handleBlur = () => {
  resetDrawingMode();
  const fabricCanvas = fabricCanvasRef.current;
  if (!fabricCanvas) return;

  fabricCanvas.isDrawingMode = true;
  
  // Create a new PencilBrush for drawing
  fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
  
  // Set the brush color to gray with slight transparency (rgba)
  fabricCanvas.freeDrawingBrush.color = "rgba(128, 128, 128, 0.9)";  // Grey color with 50% opacity
  
  // Adjust the brush width for zoom
  fabricCanvas.freeDrawingBrush.width = 20 / zoomLevel; // Adjust eraser size for zoom
};

const handleSavePDF = async () => {
  const fabricCanvas = fabricCanvasRef.current;
  if (!fabricCanvas || !pdfFile) return;

  // Initialize jsPDF
  const pdf = new jsPDF();

  // Get the dimensions of the PDF page
  const pdfWidth = 210; // A4 width in mm
  const pdfHeight = 297; // A4 height in mm

  // If you need to add more pages, you can do so like this:
  pdf.addPage(); // For example, you can add a new page

  // Render the canvas overlay onto the PDF
  const dataURL = fabricCanvas.toDataURL({
    format: "png",
    multiplier: 2, // To ensure good resolution for the annotations
  });

  // Add the dataURL to the PDF (this is where the annotations will appear)
  pdf.addImage(dataURL, "PNG", 0, 0, pdfWidth, pdfHeight);

  // Save the final PDF
  pdf.save("annotated.pdf");
};

  const handleUndo = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas && actionStack.current.length > 1) {
      redoStack.current.push(actionStack.current.pop());
      fabricCanvas.loadFromJSON(
        actionStack.current[actionStack.current.length - 1],
        () => fabricCanvas.renderAll()
      );
    }
  };

  const handleRedo = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas && redoStack.current.length > 0) {
      const redoState = redoStack.current.pop();
      actionStack.current.push(redoState);
      fabricCanvas.loadFromJSON(redoState, () => fabricCanvas.renderAll());
    }
  };

  // const onPdfLoad = () => {
  //   setPdfLoaded(true);
  // };

  return (
    <div className="pdf-editor">
      <div className="toolbar">
        <input type="file" accept="application/pdf" onChange={handleFileUpload} />
        <button onClick={handleAddText}>Add Text</button>
        <button onClick={handlePencil}>Pencil</button>
        <button onClick={handleErase}>Erase</button>
        <button onClick={handleBlur}>Blur</button>
        <button onClick={handleSavePDF}>Save PDF</button>
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleRedo}>Redo</button>
      </div>

      <div className="editor">
        {pdfFile && (
          <div
            className="pdf-container"
            style={{
              position: "relative",
              width: `${800 * zoomLevel}px`, // Adjust width based on zoom
              height: `${1000 * zoomLevel}px`, // Adjust height based on zoom
            }}
          >
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer
                fileUrl={URL.createObjectURL(pdfFile)}
                plugins={[zoomPluginInstance]}
                onDocumentLoad={onPdfLoad}
              />
            </Worker>

            <canvas
              ref={canvasRef}
              className="canvas-overlay"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 999,
              }}
            ></canvas>

            <div className="zoom-controls">
              <ZoomOutButton />
              <ZoomPopover />
              <ZoomInButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFEditor;
