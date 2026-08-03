import jsPDF from "jspdf";

export function exportAsPdf(text, filename = "meeting-analysis.pdf") {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;

  doc.setFontSize(16);
  doc.text("MeetingMate AI - Meeting Analysis", margin, 20);

  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, usableWidth);

  let y = 32;
  const lineHeight = 6;

  lines.forEach((line) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  doc.save(filename);
}

export function exportAsTxt(text, filename = "meeting-analysis.txt") {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Copy failed:", err);
    return false;
  }
}