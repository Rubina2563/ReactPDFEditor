import React, { useEffect } from 'react';
import { Canvas, Textbox } from 'fabric';  // Corrected import

const PDFEditorCanvas = ({ canvasRef }) => {
  useEffect(() => {
    const canvas = new Canvas('editor-canvas', {
      backgroundColor: 'transparent',
      height: 800,
      width: 600,
    });
    canvasRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, [canvasRef]);

  return <canvas id="editor-canvas"></canvas>;
};

export default PDFEditorCanvas;
