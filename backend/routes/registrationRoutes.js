import express from "express";
import {pool} from "../db/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

import {
    createRegistration,
    getRegistration
} from "../controllers/registrationController.js";

const router = express.Router();

router.get(
    "/check",
    verifyToken,
    async (req, res) => {
        try {
            const { competition_id } = req.query;
            const userId = req.user.id;

            if (!competition_id) {
                return res.status(400).json({ error: "Missing competition_id" });
            }

            const existing = await pool.query(
                `SELECT registration_id FROM registration
                 WHERE competition_id = $1 AND user_id = $2`,
                [competition_id, userId]
            );

            if (existing.rowCount > 0) {
                return res.json({
                    exists: true,
                    registration_id: existing.rows[0].registration_id
                });
            }

            // Check competition reg window
            const comp = await pool.query(
                `SELECT reg_start, reg_end
                 FROM competition WHERE competition_id = $1`,
                [competition_id]
            );

            if (comp.rowCount === 0) {
                return res.status(404).json({ error: "Competition not found" });
            }

            const { reg_start, reg_end } = comp.rows[0];
            const today = new Date();

            if (today < new Date(reg_start) || today > new Date(reg_end)) {
                return res.json({
                    exists: false,
                    closed: true,
                    reason: "Registration period is closed"
                });
            }

            return res.json({ exists: false, closed: false });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

router.get("/:registration_id", verifyToken, getRegistration);
router.post(
    "/",
    verifyToken,
    requireRole("soutezici", "user"),
    createRegistration
);


export default router;

