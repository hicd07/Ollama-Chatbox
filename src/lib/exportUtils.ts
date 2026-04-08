import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import * as XLSX from "xlsx";
import { marked } from "marked";

export const exportToPDF = (title: string, content: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(title, margin, y);
  y += 15;

  // Simple Markdown Parser for PDF
  const lines = content.split('\n');
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  lines.forEach(line => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }

    if (line.startsWith('# ')) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(line.replace('# ', ''), margin, y);
      y += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
    } else if (line.startsWith('## ')) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(line.replace('## ', ''), margin, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
    } else if (line.trim() === '') {
      y += 5;
    } else {
      const splitText = doc.splitTextToSize(line, contentWidth);
      doc.text(splitText, margin, y);
      y += (splitText.length * 6);
    }
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

export const exportToWord = async (title: string, content: string) => {
  const tokens = marked.lexer(content);
  const children: any[] = [];

  // Add Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Parse Markdown Tokens
  tokens.forEach((token: any) => {
    if (token.type === 'heading') {
      const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
      children.push(
        new Paragraph({
          text: token.text,
          heading: levels[token.depth - 1] || HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (token.type === 'paragraph') {
      const textRuns: TextRun[] = [];
      
      // Handle simple inline formatting (bold/italic)
      // Note: marked tokens for paragraphs can have nested tokens if using recursive parsing, 
      // but for simplicity we'll handle the text.
      children.push(
        new Paragraph({
          children: [new TextRun({ text: token.text, size: 24 })],
          spacing: { after: 200 },
        })
      );
    } else if (token.type === 'list') {
      token.items.forEach((item: any) => {
        children.push(
          new Paragraph({
            text: item.text,
            bullet: { level: 0 },
            spacing: { after: 120 },
          })
        );
      });
    } else if (token.type === 'space') {
      // Skip
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}.docx`;
  link.click();
};

export const exportToExcel = (title: string, data: any[]) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
};

export const exportToTXT = (title: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}.txt`;
  link.click();
};

export const exportToJSON = (title: string, content: string) => {
  try {
    // Try to parse if it's already a stringified JSON, otherwise wrap it
    let jsonContent;
    try {
      jsonContent = JSON.parse(content);
    } catch {
      jsonContent = { content, generatedAt: new Date().toISOString() };
    }
    
    const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.json`;
    link.click();
  } catch (e) {
    console.error("JSON Export failed", e);
  }
};
