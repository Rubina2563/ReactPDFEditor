import React, { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import jsPDF from "jspdf";
import { pdfjs } from "react-pdf";
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
  const onPdfLoad = async (e) => {
  setPdfLoaded(true);
  if (pdfFile && canvasRef.current) {
    const pdfDocument = await pdfjs.getDocument(URL.createObjectURL(pdfFile)).promise;
    const firstPage = await pdfDocument.getPage(1);

    const viewport = firstPage.getViewport({ scale: 1 });

    const fabricCanvas = fabricCanvasRef.current;

    // Update canvas dimensions based on the PDF page size
    canvasRef.current.width = viewport.width;
    canvasRef.current.height = viewport.height;

    if (fabricCanvas) {
      fabricCanvas.setWidth(viewport.width);
      fabricCanvas.setHeight(viewport.height);
      fabricCanvas.renderAll();
    }
  }
};

  useEffect(() => {
    if (pdfLoaded && canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: "transparent",
        selection: true,
      });

      fabricCanvasRef.current = fabricCanvas;
      actionStack.current.push(fabricCanvas.toJSON());

      return () => {
        fabricCanvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [pdfLoaded]);

useEffect(() => {
  if (fabricCanvasRef.current && pdfLoaded) {
    const fabricCanvas = fabricCanvasRef.current;

    // Ensure the canvas size is based on the PDF dimensions
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

    const pdfDocument = await pdfjs.getDocument(URL.createObjectURL(pdfFile)).promise;

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);

      const viewport = page.getViewport({ scale: 1 });
      const canvasElement = document.createElement("canvas");
      const context = canvasElement.getContext("2d");

      canvasElement.width = viewport.width;
      canvasElement.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        multiplier: 2,
      });

      if (pageNum > 1) {
        pdf.addPage();
      }
      pdf.addImage(dataURL, "PNG", 0, 0, 210, 297); // A4 dimensions
    }

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
