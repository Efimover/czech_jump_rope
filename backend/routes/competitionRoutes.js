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
                reg_end
            } = req.body;

            const owner_id = req.user.id; // JISTOTA – z tokenu

            const result = await pool.query(
                `
                INSERT INTO competition (
                    owner_id, name, description, start_date, end_date, reg_start, reg_end
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
                `,
                [owner_id, name, description, start_date, end_date, reg_start, reg_end]
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
            SELECT * 
            FROM competition
            ORDER BY start_date ASC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error("ERROR loading competitions:", err);
        res.status(500).json({ error: "Server error" });
    }
});



export default router;
