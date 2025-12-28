import PDFDocument from "pdfkit";
import path from "path";
import { drawHeader } from "./header.js";
import { drawTableHeader, drawRow } from "./table.js";

export function generatePdf(res, competition, rows) {
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    doc.font(path.resolve("assets/fonts/Roboto-Regular.ttf"));
    doc.registerFont("Roboto-Bold", path.resolve("assets/fonts/Roboto-Bold.ttf"));

    doc.pipe(res);

    drawHeader(doc, competition);

    const grouped = {};
    rows.forEach(r => {
        grouped[r.discipline_name] ??= [];
        grouped[r.discipline_name].push(r);
    });

    for (const [discipline, data] of Object.entries(grouped)) {
        doc.addPage();

        doc.font("Roboto-Bold").fontSize(15).text(`Disciplína: ${discipline}`);
        let y = drawTableHeader(doc, doc.y + 10);

        let odd = false;
        for (const r of data) {
            if (y > 770) {
                doc.addPage();
                y = drawTableHeader(doc, 40);
            }
            drawRow(doc, r, y, odd);
            y += 18;
            odd = !odd;
        }
    }

    doc.end();
}
