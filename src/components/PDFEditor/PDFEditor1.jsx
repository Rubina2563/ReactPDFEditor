
import React, { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import jsPDF from "jspdf";

import "./PDFEditor.css";

const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTool, setActiveTool] = useState(""); // Track the active tool
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const history = useRef([]);
  const redoStack = useRef([]);
  const activeTextRef = useRef(null); // Reference to active text object

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const renderPDFToCanvas = async (pdfFile) => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas || !canvasRef.current) return;

    const reader = new FileReader();
    reader.onload = async () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

      const pdfData = new Uint8Array(reader.result);
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const page = await pdfDoc.getPage(1);

      const viewport = page.getViewport({ scale: zoomLevel });
      const canvasWidth = canvasRef.current.parentElement.offsetWidth;
      const scale = canvasWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      fabricCanvas.setWidth(scaledViewport.width);
      fabricCanvas.setHeight(scaledViewport.height);

      const pdfCanvas = document.createElement("canvas");
      const context = pdfCanvas.getContext("2d");
      pdfCanvas.width = scaledViewport.width;
      pdfCanvas.height = scaledViewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };
      await page.render(renderContext).promise;

      const imageDataUrl = pdfCanvas.toDataURL();
      fabric.Image.fromURL(imageDataUrl, (img) => {
        img.scaleToWidth(fabricCanvas.width);
        img.scaleToHeight(fabricCanvas.height);
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
      });
    };

    reader.readAsArrayBuffer(pdfFile);
  };

  useEffect(() => {
    if (pdfFile && canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
      });

      fabricCanvasRef.current = fabricCanvas;
      renderPDFToCanvas(pdfFile);


    // Save history for pencil strokes or free drawings
    fabricCanvas.on("path:created", () => {
      saveHistory();
    });


      return () => {
        fabricCanvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [pdfFile, zoomLevel]);

  const clearActiveTool = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = false;
  };

  const handleAddText = () => {
    clearActiveTool();
    setActiveTool("addText");

    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const text = new fabric.Textbox("Enter Text Here", {
      left: fabricCanvas.width / 2,
      top: fabricCanvas.height / 2,
      width: 200,
      fontSize: 16,
      fill: "black",
      originX: "center",
      originY: "center",
    });

    
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
saveHistory();
    activeTextRef.current = text; // Store the active text object
  };

  const handlePencil = () => {
    clearActiveTool();
    setActiveTool("pencil");

    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = true;
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.color = "black";
    fabricCanvas.freeDrawingBrush.width = 2 / zoomLevel;
     saveHistory();
  };

  const handleErase = () => {
    clearActiveTool();
    setActiveTool("erase");

    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = true;
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.color = "white";
    fabricCanvas.freeDrawingBrush.width = 20 / zoomLevel;
     saveHistory();
  };

  const handleBlur = () => {
    clearActiveTool();
    setActiveTool("blur");

    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 50,
      fill: "rgba(128, 128, 128, 0.8)",
    });

    saveHistory();
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
  };

  const handleSavePDF = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas || !pdfFile) return;

    const pdf = new jsPDF();
    const dataURL = fabricCanvas.toDataURL({ format: "png", multiplier: 2 });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(dataURL, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("annotated.pdf");
  };

  const handleZoomIn = () => {
    setZoomLevel((prevZoom) => prevZoom + 0.1);
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoom) => Math.max(0.1, prevZoom - 0.1));
  };

const saveHistory = () => {
  const fabricCanvas = fabricCanvasRef.current;
  if (!fabricCanvas) return;

  // Convert the current canvas state to JSON and push to history
  const currentState = fabricCanvas.toJSON();

  // Avoid adding duplicate states in the history array
  if (
    historyRef.current.length === 0 || 
    JSON.stringify(historyRef.current[historyRef.current.length - 1]) !== JSON.stringify(currentState)
  ) {
    historyRef.current.push(currentState);
  }
};

  const handleBackspace = (e) => {
    if (activeTextRef.current && e.key === "Backspace") {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (activeObject && activeObject === activeTextRef.current) {
        const currentText = activeObject.text;
        if (currentText.length > 0) {
          activeObject.set({ text: currentText.slice(0, -1) });
          fabricCanvasRef.current.renderAll();
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleBackspace);

    return () => {
      window.removeEventListener("keydown", handleBackspace);
    };
  }, []);

const handleUndo = () => {
  const fabricCanvas = fabricCanvasRef.current;
  if (!fabricCanvas || historyRef.current.length === 0) return;

  // Remove the last state from the history
  historyRef.current.pop();

  // Load the previous state (if available)
  const previousState =
    historyRef.current[historyRef.current.length - 1] || null;

  if (previousState) {
    fabricCanvas.loadFromJSON(previousState, () => {
      fabricCanvas.renderAll();
    });
  } else {
    // If no previous state, clear the canvas
    fabricCanvas.clear();
  }
};

  // Handle image upload
const handleAddImage = (e) => {
  // Ensure files are selected
  const files = e.target.files;
  if (!files || files.length === 0) {
    alert("No file selected. Please choose an image.");
    return;
  }

  const file = files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      const fabricCanvas = fabricCanvasRef.current;
      if (!fabricCanvas) return;

      fabric.Image.fromURL(reader.result, (img) => {
        img.set({
          left: fabricCanvas.width / 2,
          top: fabricCanvas.height / 2,
          scaleX: 0.5, // Optional: adjust size
          scaleY: 0.5, // Optional: adjust size
        });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    saveHistory();
  } else {
    alert("Please upload a valid image file.");
  }
};

  return (
    <div className="pdf-editor">
      <div className="toolbar">
        <input type="file" accept="application/pdf" onChange={handleFileUpload} />
        <button onClick={handleAddText}>Add Text</button>
        <button onClick={handlePencil}>Pencil</button>
        <button onClick={handleErase}>Erase</button>
        <button onClick={handleBlur}>Blur</button>
        <button onClick={handleSavePDF}>Save PDF</button>
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
         <button onClick={handleUndo}>Undo</button>
    <input 
  type="file" 
  accept="image/*" 
  onChange={handleAddImage} 

  className="custom-file-input" 
/>
      </div>

      <div className="pdf-container" style={{ cursor: activeTextRef.current ? "pointer" : "default" }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default PDFEditor;