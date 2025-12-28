import { COLORS, SIZES, LAYOUT, FONTS } from "./styles.js";

export function drawTableHeader(doc, y) {
    doc
        .rect(40, y, LAYOUT.pageWidth, 20)
        .fill(COLORS.headerBg);

    doc
        .font(FONTS.bold)
        .fontSize(SIZES.tableHeader)
        .fillColor(COLORS.headerText)
        .text("Tým", 45, y + 6, { width: 80 })
        .text("Příjmení", 130, y + 6, { width: 100 })
        .text("Jméno", 235, y + 6, { width: 90 })
        .text("Rok", 330, y + 6, { width: 40, align: "center" })
        .text("Pohl.", 375, y + 6, { width: 45, align: "center" })
        .text("Označení", 430, y + 6, { width: 80, align: "center" });

    return y + 22;
}

export function drawRow(doc, row, y, odd) {
    doc
        .rect(40, y, LAYOUT.pageWidth, LAYOUT.rowHeight)
        .fill(odd ? COLORS.rowEven : COLORS.rowOdd);

    doc
        .font(FONTS.regular)
        .fontSize(SIZES.tableRow)
        .fillColor("#000")
        .text(row.team_name || "-", 45, y + 5, { width: 80 })
        .text(row.last_name, 130, y + 5, { width: 100 })
        .text(row.first_name, 235, y + 5, { width: 90 })
        .text(row.birth_year || "-", 330, y + 5, { width: 40, align: "center" })
        .text(row.gender || "-", 375, y + 5, { width: 45, align: "center" })
        .text(row.team_group ? row.team_group : "X", 430, y + 5, {
            width: 80,
            align: "center"
        });
}
