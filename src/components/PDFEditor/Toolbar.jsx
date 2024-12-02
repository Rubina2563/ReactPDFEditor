import React, { useEffect, useRef } from 'react';
import { Canvas, PencilBrush, Textbox } from 'fabric'; // Import Fabric.js modules explicitly

const Toolbar = ({ onSave }) => {
  const canvasRef = useRef(null); // DOM reference for the canvas
  const fabricCanvasRef = useRef(null); // Fabric.js canvas instance reference

  useEffect(() => {
    if (canvasRef.current) {
      // Initialize Fabric.js canvas
      const fabricCanvas = new Canvas(canvasRef.current);
      fabricCanvas.isDrawingMode = true; // Enable drawing mode by default
      fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.color = 'black';
      fabricCanvas.freeDrawingBrush.width = 5;

      fabricCanvasRef.current = fabricCanvas; // Save instance
    }

    return () => {
      // Cleanup Fabric.js canvas
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  const handleBlur = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush.color = 'rgba(0, 0, 0, 0.3)'; // Set semi-transparent color for blur effect
      fabricCanvas.freeDrawingBrush.width = 15; // Increase brush size for a blurring effect
    } else {
      console.error('Canvas is not initialized.');
    }
  };

  const handleErase = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush.color = 'white'; // Use white to simulate erasing
      fabricCanvas.freeDrawingBrush.width = 20; // Larger brush width for erasing
    } else {
      console.error('Canvas is not initialized.');
    }
  };

  const handleAddText = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      const text = new Textbox('Enter Text Here', {
        left: 100,
        top: 100,
        width: 200,
        fontSize: 16,
        fill: 'black',
        editable: true, // Make text editable immediately
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text); // Focus on the text box
      fabricCanvas.renderAll(); // Refresh canvas
    } else {
      console.error('Canvas is not initialized.');
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid black', marginBottom: '10px' }}
      />
      <div className="toolbar">
        <button onClick={handleBlur}>Blur</button>
        <button onClick={handleErase}>Erase</button>
        <button onClick={handleAddText}>Add Text</button>
        <button onClick={onSave}>Save PDF</button>
      </div>
    </div>
  );
};

export default Toolbar;
