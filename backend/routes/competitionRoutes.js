import express from "express";
import { pool } from "../db/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Organizátor vytváří soutěž
router.post(
    "/",
    verifyToken,
    requireRole("admin"),
    async (req, res) => {
        try {
            const {
                name,
                description,
                start_date,
                end_date,
                reg_start,
                reg_end,
                location
            } = req.body;

            const owner_id = req.user.id; // z tokenu

            const result = await pool.query(
                `
                INSERT INTO competition (
                    owner_id, name, description, start_date, end_date, reg_start, reg_end,location
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
                `,
                [owner_id, name, description, start_date, end_date, reg_start, reg_end, location]
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

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.*,
                u.first_name AS owner_first_name,
                u.last_name AS owner_last_name,
                u.email AS owner_email
            FROM competition c
                     JOIN user_account u ON u.user_id = c.owner_id
            ORDER BY c.start_date ASC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error("ERROR loading competitions:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.*,
                u.first_name AS owner_first_name,
                u.last_name AS owner_last_name,
                u.email AS owner_email
            FROM competition c
            JOIN user_account u ON u.user_id = c.owner_id
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


export default router;
