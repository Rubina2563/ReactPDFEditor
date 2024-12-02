import { PDFDocument } from "pdf-lib";

export const savePDF = async (canvas, pdfFile) => {
  const pdfDoc = await PDFDocument.load(await pdfFile.arrayBuffer());
  const page = pdfDoc.getPages()[0];

  const canvasDataURL = canvas.toDataURL("image/png");
  const pngImage = await pdfDoc.embedPng(canvasDataURL);

  const { width, height } = page.getSize();
  page.drawImage(pngImage, { x: 0, y: 0, width, height });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "edited.pdf";
  link.click();
};
