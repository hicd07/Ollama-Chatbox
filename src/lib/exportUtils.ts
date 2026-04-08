import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import * as XLSX from "xlsx";
import { marked } from "marked";

// Helper to strip markdown from a string for simple text runs
const stripMd = (text: string) => text.replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\1/g, '$2');

export const exportToPDF = (title: string, content: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(title, margin, y);
  y += 15;

  const tokens = marked.lexer(content);

  tokens.forEach((token: any) => {
    if (token.type === 'heading') {
      const sizes = [20, 18, 16, 14, 12, 11];
      const size = sizes[token.depth - 1] || 11;
      checkPage(size + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(token.text, contentWidth);
      doc.text(lines, margin, y);
      y += (lines.length * (size * 0.5)) + 5;
    } else if (token.type === 'paragraph') {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const cleanText = stripMd(token.text);
      const lines = doc.splitTextToSize(cleanText, contentWidth);
      checkPage(lines.length * 6 + 5);
      doc.text(lines, margin, y);
      y += (lines.length * 6) + 5;
    } else if (token.type === 'list') {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      token.items.forEach((item: any) => {
        const cleanText = `• ${stripMd(item.text)}`;
        const lines = doc.splitTextToSize(cleanText, contentWidth);
        checkPage(lines.length * 6 + 2);
        doc.text(lines, margin, y);
        y += (lines.length * 6) + 2;
      });
      y += 3;
    } else if (token.type === 'table') {
      const headers = token.header.map((h: any) => h.text);
      const rows = token.rows.map((row: any) => row.map((c: any) => c.text));
      
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: y,
        margin: { left: margin },
        theme: 'grid',
        headStyles: { fillColor: [20, 20, 20] },
        didDrawPage: (data: any) => {
          y = data.cursor.y + 10;
        }
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else if (token.type === 'hr') {
      checkPage(5);
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

export const exportToWord = async (title: string, content: string) => {
  const tokens = marked.lexer(content);
  const children: any[] = [];

  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

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
      children.push(
        new Paragraph({
          children: [new TextRun({ text: stripMd(token.text), size: 22 })],
          spacing: { after: 200 },
        })
      );
    } else if (token.type === 'list') {
      token.items.forEach((item: any) => {
        children.push(
          new Paragraph({
            text: stripMd(item.text),
            bullet: { level: 0 },
            spacing: { after: 120 },
          })
        );
      });
    } else if (token.type === 'table') {
      const tableRows = [
        new TableRow({
          children: token.header.map((h: any) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h.text, bold: true })] })],
            shading: { fill: "F2F2F2" }
          }))
        }),
        ...token.rows.map((row: any) => new TableRow({
          children: row.map((c: any) => new TableCell({
            children: [new Paragraph({ text: c.text })]
          }))
        }))
      ];

      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          }
        })
      );
    } else if (token.type === 'hr') {
      children.push(new Paragraph({ border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } } }));
    }
  });

  const doc = new Document({
    sections: [{ children }],
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
