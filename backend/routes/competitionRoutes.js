import express from "express";
import { pool } from "../db/index.js"

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const {
            owner_id,
            name,
            description,
            start_date,
            end_date,
            reg_start,
            reg_end
        } = req.body;

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

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("ERROR saving competition:", err);
        return res.status(500).json({ error: "Database error" });
    }
});

export default router;
