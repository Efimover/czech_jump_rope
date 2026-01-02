import express from "express";
import { pool } from "../db/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {generatePdf} from "../pdf/exportPdf.js";
import { logCompetitionAction } from "../services/competitionAuditService.js";

const router = express.Router();

// Organizátor vytváří soutěž
router.post(
    "/",
    verifyToken,
    requireRole("admin", "organizator"),
    async (req, res) => {
        try {
            const {
                name,
                description,
                start_date,
                end_date,
                reg_start,
                reg_end,
                location,
                referee_id
            } = req.body;

            // 1️⃣ Normalizace prázdných hodnot
            const normalizeDate = (v) =>
                v === "" || v === undefined ? null : v;

            const startDate = normalizeDate(start_date);
            const endDate   = normalizeDate(end_date);
            const regStart  = normalizeDate(reg_start);
            const regEnd    = normalizeDate(reg_end);

            // 2️⃣ VALIDACE POVINNÝCH POLÍ (⬅️ SEM PATŘÍ)
            if (!name || !startDate || !endDate || !regStart || !regEnd) {
                return res.status(400).json({
                    error: "Vyplňte název soutěže a všechna povinná data"
                });
            }

            if (new Date(regStart) > new Date(regEnd)) {
                return res.status(400).json({
                    error: "Registrace nemůže končit dříve než začne"
                });
            }

            if (new Date(startDate) > new Date(endDate)) {
                return res.status(400).json({
                    error: "Konec soutěže nemůže být dříve než začátek"
                });
            }

            if (new Date(regStart) > new Date(startDate)) {
                return res.status(400).json({
                    error: "Start registrace nesmí být pozdějí než start soutěží"
                });
            }

            // 3️⃣ Rozhodčí – validace
            const owner_id = req.user.user_id;

            if (referee_id) {
                const ref = await pool.query(
                    "SELECT 1 FROM referee WHERE referee_id = $1",
                    [referee_id]
                );
                if (ref.rowCount === 0) {
                    return res.status(400).json({
                        error: "Neplatný rozhodčí"
                    });
                }
            }

            const refereeId = referee_id ?? null;

            // 4️⃣ INSERT
            const result = await pool.query(
                `
                INSERT INTO competition (
                    owner_id, name, description,
                    start_date, end_date,
                    reg_start, reg_end,
                    location, referee_id
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                RETURNING *
                `,
                [
                    owner_id,
                    name,
                    description,
                    startDate,
                    endDate,
                    regStart,
                    regEnd,
                    location,
                    refereeId
                ]
            );

            res.status(201).json({
                message: "Competition created",
                competition: result.rows[0]
            });

        } catch (err) {
            console.error("ERROR saving competition:", err);
            res.status(500).json({ error: "Database error" });
        }
    }
);
// ======================================================
//  DISCIPLÍNY PRO KONKRÉTNÍ SOUTĚŽ
//  GET /api/competitions/:competition_id/disciplines
// ======================================================

router.get(
    "/:competition_id/disciplines",
    verifyToken,
    async (req, res) => {
        const { competition_id } = req.params;

        try {
            const result = await pool.query(
                `
                SELECT
                    d.discipline_id,
                    d.name,
                    d.is_team,
                    d.pocet_athletes,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'age_category_id', ac.age_category_id,
                                'min_age', ac.min_age,
                                'max_age', ac.max_age
                            )
                        ) FILTER (WHERE ac.age_category_id IS NOT NULL),
                        '[]'
                    ) AS age_categories
                FROM competition_discipline cd
                JOIN discipline d ON d.discipline_id = cd.discipline_id
                LEFT JOIN discipline_age_category dac ON dac.discipline_id = d.discipline_id
                LEFT JOIN age_category ac ON ac.age_category_id = dac.age_category_id
                WHERE cd.competition_id = $1
                GROUP BY d.discipline_id
                ORDER BY d.name
                `,
                [competition_id]
            );

            res.json(result.rows);
        } catch (err) {
            console.error("getDisciplinesForCompetition error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);


router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.*,
                u.first_name AS owner_first_name,
                u.last_name AS owner_last_name,

                r.referee_id,
                r.first_name AS referee_first_name,
                r.last_name AS referee_last_name,
                r.category AS referee_category

            FROM competition c
                     JOIN user_account u ON u.user_id = c.owner_id
                     LEFT JOIN referee r ON r.referee_id = c.referee_id
            WHERE c.competition_id = $1 AND deleted_at IS NULL
        `, [req.params.id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                code: "COMPETITION_DELETED",
                error: "Soutěž byla odstraněna"

            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("ERROR loading competition:", err);
        res.status(500).json({ error: "Server error" });
    }
});



router.get("/", async (req, res) => {
    try {
        const { status, time, discipline } = req.query;

        const conditions = [];
        const values = [];
        let idx = 1;
        const baseConditions = ["c.deleted_at IS NULL"];

        if (status === "open") {
            baseConditions.push(`NOW() BETWEEN c.reg_start AND c.reg_end`);
        }


        if (status === "closed") {
            baseConditions.push(`NOW() NOT BETWEEN c.reg_start AND c.reg_end`);
        }

        if (time === "upcoming") {
            baseConditions.push(`c.start_date >= NOW()`);
        }
        if (time === "past") {
            baseConditions.push(`c.end_date < NOW()`);
        }

        if (discipline) {
            values.push(`%${discipline.toLowerCase()}%`);
            baseConditions.push(`
                EXISTS (
                    SELECT 1
                    FROM competition_discipline cd
                    JOIN discipline d ON d.discipline_id = cd.discipline_id
                    WHERE cd.competition_id = c.competition_id
                      AND LOWER(d.name) LIKE $${idx++} AND c.deleted_at IS NULL
                )
            `);
        }

        const where =
            baseConditions.length > 0
                ? "WHERE " + baseConditions.join(" AND ")
                : "";

        const result = await pool.query(
            `
                SELECT DISTINCT c.*
                FROM competition c
                    ${where}
                ORDER BY c.start_date ASC
            `,
            values
        );

        res.json(result.rows);
    } catch (err) {
        console.error("competition filter error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.put(
    "/:id",
    verifyToken,
    requireRole("admin", "organizator"),
    async (req, res) => {
        try {
            const competitionId = req.params.id;
            const userId = req.user.user_id;

            const {
                name,
                description,
                location,
                start_date,
                end_date,
                reg_start,
                reg_end,
                referee_id
            } = req.body;

            /* =====================================================
               1️⃣ Načti existující soutěž
            ===================================================== */
            const existingRes = await pool.query(
                `
                    SELECT
                        owner_id,
                        start_date,
                        end_date,
                        reg_start,
                        reg_end
                    FROM competition
                    WHERE competition_id = $1 AND deleted_at IS NULL
                `,
                [competitionId]
            );

            if (existingRes.rowCount === 0) {
                return res.status(404).json({ error: "Soutěž nenalezena" });
            }

            const existing = existingRes.rows[0];

            /* =====================================================
               2️⃣ Ověř oprávnění (organizátor jen své soutěže)
            ===================================================== */
            const isAdmin = req.user.roles?.includes("admin");
            if (!isAdmin && existing.owner_id !== userId) {
                return res.status(403).json({ error: "Nepovolený přístup" });
            }

            /* =====================================================
               3️⃣ Pomocná funkce pro porovnání dat
            ===================================================== */
            const sameDate = (a, b) =>
                new Date(a).toISOString().slice(0, 10) ===
                new Date(b).toISOString().slice(0, 10);

            const now = new Date();
            const registrationOpen =
                now >= new Date(existing.reg_start) &&
                now <= new Date(existing.reg_end);

            const datesChanged =
                !sameDate(existing.start_date, start_date) ||
                !sameDate(existing.end_date, end_date) ||
                !sameDate(existing.reg_start, reg_start) ||
                !sameDate(existing.reg_end, reg_end);

            /* =====================================================
               4️⃣ Blokace změny termínů po otevření registrace
            ===================================================== */
            if (registrationOpen && datesChanged) {
                return res.status(400).json({
                    code: "REGISTRATION_OPEN",
                    error: "Po otevření registrací nelze měnit termíny"
                });
            }

            /* =====================================================
               5️⃣ Validace rozhodčího (pokud je zadán)
            ===================================================== */
            if (referee_id) {
                const refCheck = await pool.query(
                    `SELECT 1 FROM referee WHERE referee_id = $1`,
                    [referee_id]
                );

                if (refCheck.rowCount === 0) {
                    return res.status(400).json({
                        error: "Neplatný rozhodčí"
                    });
                }
            }

            /* =====================================================
               6️⃣ UPDATE soutěže
            ===================================================== */
            const updateRes = await pool.query(
                `
                    UPDATE competition
                    SET
                        name = $1,
                        description = $2,
                        location = $3,
                        start_date = $4,
                        end_date = $5,
                        reg_start = $6,
                        reg_end = $7,
                        referee_id = $8,
                        updated_at = NOW()
                    WHERE competition_id = $9
                    RETURNING *
                `,
                [
                    name,
                    description,
                    location,
                    start_date,
                    end_date,
                    reg_start,
                    reg_end,
                    referee_id || null,
                    competitionId
                ]
            );

            res.json({
                message: "Soutěž byla úspěšně upravena",
                competition: updateRes.rows[0]
            });

        } catch (err) {
            console.error("ERROR updating competition:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);


router.get(
"/:id/export/pdf",
    verifyToken,
    requireRole("admin", "organizator"),
    async (req, res) => {
        const competitionId = req.params.id;
        const userId = req.user.user_id;

        try {
            // 🔒oprávnění
            const compRes = await pool.query(
                `
        SELECT *
        FROM competition
        WHERE competition_id = $1 AND deleted_at IS NULL
          AND (
            owner_id = $2
            OR EXISTS (
              SELECT 1
              FROM role_user ru
              JOIN role r ON r.role_id = ru.role_id
              WHERE ru.user_id = $2 AND r.name = 'admin'
            )
          )
        `,
                [competitionId, userId]
            );

            if (compRes.rowCount === 0) {
                return res.status(403).json({ error: "Nepovolený přístup" });
            }

            const competition = compRes.rows[0];

            // 📥 DATA
            const dataRes = await pool.query(
                `
        SELECT
          t.name AS team_name,
          a.first_name,
          a.last_name,
          a.birth_year,
          a.gender,
          d.name AS discipline_name,
          e.team_group
        FROM registration r
        JOIN team t ON t.registration_id = r.registration_id
        JOIN team_athlete ta ON ta.team_id = t.team_id
        JOIN athlete a ON a.athlete_id = ta.athlete_id
        LEFT JOIN entry e
          ON e.athlete_id = a.athlete_id
         AND e.registration_id = r.registration_id
        LEFT JOIN discipline d ON d.discipline_id = e.discipline_id
        WHERE r.competition_id = $1
          AND r.status = 'submitted'
        ORDER BY d.name, t.name, a.last_name
        `,
                [competitionId]
            );

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=prihlasky_${competition.name}.pdf`
            );

            // 🚀 JEDINÝ PDF ŘÁDEK
            generatePdf(res, competition, dataRes.rows);

        } catch (err) {
            console.error("PDF export error:", err);
            res.status(500).json({ error: "Chyba při generování PDF" });
        }
    }
);

router.delete(
    "/:id",
    verifyToken,
    requireRole("admin", "organizator"),
    async (req, res) => {
        const competitionId = req.params.id;
        const userId = req.user.user_id;
        const isAdmin = req.user.roles.includes("admin");

        try {
            // 1️⃣ načti soutěž
            const compRes = await pool.query(
                `
                    SELECT owner_id, deleted_at
                    FROM competition
                    WHERE competition_id = $1
                `,
                [competitionId]
            );

            if (compRes.rowCount === 0) {
                return res.status(404).json({ error: "Soutěž nenalezena" });
            }

            const competition = compRes.rows[0];

            if (competition.deleted_at) {
                return res.status(400).json({
                    error: "Soutěž je již smazána"
                });
            }

            // 2️⃣ oprávnění
            if (!isAdmin && competition.owner_id !== userId) {
                return res.status(403).json({
                    error: "Nemáte oprávnění smazat tuto soutěž"
                });
            }

            // 3️⃣ kontrola přihlášek
            const regRes = await pool.query(
                `
                SELECT 1
                FROM registration
                WHERE competition_id = $1
                  AND status = 'submitted'
                LIMIT 1
                `,
                [competitionId]
            );

            if (regRes.rowCount > 0) {
                return res.status(400).json({
                    code: "HAS_REGISTRATIONS",
                    error: "Soutěž nelze smazat – existují odeslané přihlášky"
                });
            }

            // 4️Soft delete
            await pool.query(
                `
                UPDATE competition
                SET deleted_at = NOW(),
                    deleted_by = $1
                WHERE competition_id = $2
                `,
                [userId, competitionId]
            );

            // Audit log
            await logCompetitionAction({
                competition_id: competitionId,
                actor_user_id: userId,
                actor_role: req.user.active_role,
                action: "DELETE",
                message: `Soutěž byla smazána uživatelem ${req.user.active_role}`
            });

            res.json({
                success: true,
                message: "Soutěž byla odstraněna"
            });

        } catch (err) {
            console.error("Delete competition error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

router.get(
    "/:id/audit-log",
    verifyToken,
    requireRole("admin", "organizator"),
    async (req, res) => {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                ca.audit_id,
                ca.action,
                ca.actor_role,
                ca.message,
                ca.created_at,
                u.email AS actor_email
            FROM competition_audit ca
            JOIN user_account u ON u.user_id = ca.actor_user_id
            WHERE ca.competition_id = $1
            ORDER BY ca.created_at DESC
            `,
            [id]
        );

        res.json(result.rows);
    }
);

export default router;
