import express from "express";
import { pool } from "../db/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET /api/referees
router.get(
    "/",
    verifyToken,
    async (req, res) => {
        const result = await pool.query(
            "SELECT referee_id, first_name, last_name, category FROM referee ORDER BY last_name"
        );
        res.json(result.rows);
    }
);

// POST /api/referees
router.post(
    "/",
    verifyToken,
    requireRole("admin", "organizator"),
    async (req, res) => {
        const { first_name, last_name, category } = req.body;

        if (!first_name || !last_name) {
            return res.status(400).json({ error: "Jméno a příjmení jsou povinné" });
        }

        const result = await pool.query(
            `
                INSERT INTO referee (first_name, last_name, category)
                VALUES ($1, $2, $3)
                RETURNING *
            `,
            [first_name, last_name, category || null]
        );

        res.status(201).json(result.rows[0]);
    }
);

export default router;
