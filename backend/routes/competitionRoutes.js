import express from "express";
import { pool } from "../db/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

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

            const owner_id = req.user.user_id; // z tokenu
            if (referee_id) {
                const ref = await pool.query(
                    "SELECT 1 FROM referee WHERE referee_id = $1",
                    [referee_id]
                );
                if (ref.rowCount === 0) {
                    return res.status(400).json({ error: "Neplatný rozhodčí" });
                }
            }

            const refereeId = referee_id ?? null;

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
                    start_date,
                    end_date,
                    reg_start,
                    reg_end,
                    location,
                    refereeId
                ]
            );

            return res.status(201).json({
                message: "Competition created",
                competition: result.rows[0]
            });
        } catch (err) {
            console.error("ERROR saving competition:", err);
            return res.status(500).json({ error: "Database error" });
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
            WHERE c.competition_id = $1
        `, [req.params.id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Competition not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("ERROR loading competition:", err);
        res.status(500).json({ error: "Server error" });
    }
});

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

router.get("/", async (req, res) => {
    try {
        const { status, time, discipline } = req.query;

        const conditions = [];
        const values = [];
        let idx = 1;

        if (status === "open") {
            conditions.push(`NOW() BETWEEN c.reg_start AND c.reg_end`);
        }
        if (status === "closed") {
            conditions.push(`NOW() NOT BETWEEN c.reg_start AND c.reg_end`);
        }

        if (time === "upcoming") {
            conditions.push(`c.start_date >= NOW()`);
        }
        if (time === "past") {
            conditions.push(`c.end_date < NOW()`);
        }

        if (discipline) {
            values.push(`%${discipline.toLowerCase()}%`);
            conditions.push(`
                EXISTS (
                    SELECT 1
                    FROM competition_discipline cd
                    JOIN discipline d ON d.discipline_id = cd.discipline_id
                    WHERE cd.competition_id = c.competition_id
                      AND LOWER(d.name) LIKE $${idx++}
                )
            `);
        }

        const where =
            conditions.length > 0
                ? "WHERE " + conditions.join(" AND ")
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
                    WHERE competition_id = $1
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


export default router;
