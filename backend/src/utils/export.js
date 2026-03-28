import PDFDocument from "pdfkit";

export function toCsv(rows = []) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ];

  return lines.join("\n");
}

export function buildPdfBuffer({ title, subtitle, sections = [] }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(title, { underline: true });
    if (subtitle) {
      doc.moveDown(0.5).fontSize(10).fillColor("#4b5563").text(subtitle);
      doc.fillColor("#111827");
    }

    sections.forEach((section) => {
      doc.moveDown().fontSize(13).text(section.heading);
      (section.lines || []).forEach((line) => {
        doc.moveDown(0.25).fontSize(10).text(line);
      });
    });

    doc.end();
  });
}
