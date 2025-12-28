import { COLORS, SIZES, FONTS } from "./styles.js";


export function drawHeader(doc, competition) {
    const pageWidth = doc.page.width;
    const margin = doc.page.margins.left;

    //  HORNÍ cast
    doc
        .rect(0, 0, pageWidth, 90)
        .fill("#1e3a8a");

    // NÁZEV SOUTĚŽE
    doc
        .fillColor("white")
        .fontSize(22)
        .text(competition.name, margin, 30, {
            align: "center"
        });

    doc.moveDown(2);

    //  návrat na normální barvu
    doc.fillColor("#111827");

    //  INFO BLOK
    const infoTop = 120;

    doc
        .roundedRect(margin, infoTop, pageWidth - margin * 2, 90, 8)
        .fill("#f1f5f9");

    doc
        .fillColor("#0f172a")
        .fontSize(11)
        .text(
            `Datum konání:\n${formatDate(competition.start_date)} – ${formatDate(
                competition.end_date
            )}`,
            margin + 15,
            infoTop + 15
        );

    doc
        .text(
            `Místo:\n${competition.location || "Neuvedeno"}`,
            pageWidth / 2,
            infoTop + 15
        );

    doc.moveDown(8);

    // PODTITUL
    doc
        .fontSize(13)
        .fillColor("#1e293b")
        .text("Přehled přihlášených závodníků", {
            align: "center"
        });

    doc.moveDown(1.5);

    //  oddělovací čára
    doc
        .strokeColor("#cbd5e1")
        .moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .stroke();

    doc.moveDown(2);
}

// pomocná funkce
function formatDate(d) {
    return new Date(d).toLocaleDateString("cs-CZ");
}
