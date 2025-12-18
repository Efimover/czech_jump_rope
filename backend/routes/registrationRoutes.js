import { pool } from "../db/index.js";
import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";


import {
    createRegistration,
    getMyRegistrations,
    getRegistration,
    submitRegistration,
    deleteRegistration
} from "../controllers/registrationController.js";

import {
    createAthleteForTeam,
    getAthletesByTeam
} from "../controllers/athleteController.js";



const router = express.Router();

/**
 * ---------------------------------------------------------
 *  CHECK — zda už registrace existuje & zda je otevřená
 *  GET /api/registrations/check?competition_id=123
 * ---------------------------------------------------------
 */
router.get("/check", verifyToken, async (req, res) => {
    try {
        const { competition_id } = req.query;
        const userId = req.user.id;

        if (!competition_id) {
            return res.status(400).json({ error: "Missing competition_id" });
        }

        // 1️⃣ Existuje už registrace?
        const existing = await pool.query(
            `SELECT registration_id 
             FROM registration
             WHERE competition_id = $1 AND user_id = $2`,
            [competition_id, userId]
        );

        if (existing.rowCount > 0) {
            return res.json({
                exists: true,
                registration_id: existing.rows[0].registration_id,
            });
        }

        // 2️⃣ Je soutěž validní?
        const comp = await pool.query(
            `SELECT reg_start, reg_end 
             FROM competition 
             WHERE competition_id = $1`,
            [competition_id]
        );

        if (comp.rowCount === 0) {
            return res.status(404).json({ error: "Competition not found" });
        }

        const { reg_start, reg_end } = comp.rows[0];
        const today = new Date();

        // 3️⃣ Registrace otevřená?
        if (today < new Date(reg_start) || today > new Date(reg_end)) {
            return res.json({
                exists: false,
                closed: true,
                reason: "Registration period is closed",
            });
        }

        return res.json({
            exists: false,
            closed: false,
        });

    } catch (err) {
        console.error("CHECK registration error:", err);
        res.status(500).json({ error: "Server error" });
    }
});



router.get(
    "/my",
    verifyToken,
    getMyRegistrations
);

/**
 * ---------------------------------------------------------
 *  GET DETAIL REGISTRACE
 *  GET /api/registrations/:registration_id
 * ---------------------------------------------------------
 */
router.get("/:registration_id", verifyToken, getRegistration);

/**
 * ---------------------------------------------------------
 *  VYTVOŘIT REGISTRACI
 *  POST /api/registrations
 * ---------------------------------------------------------
 */
router.post(
    "/",
    verifyToken,
    requireRole("soutezici", "user"),
    createRegistration
);


/**
 * ---------------------------------------------------------
 *  ODESLAT PŘIHLÁŠKU (SUBMIT)
 *  POST /api/registrations/:registration_id/submit
 * ---------------------------------------------------------
 */
router.post(
    "/:registration_id/submit",
    verifyToken,
    requireRole("soutezici", "user"),
    submitRegistration
);

/**
 * ---------------------------------------------------------
 *  SMAZAT PŘIHLÁŠKU
 *  DELETE /api/registrations/:registration_id
 * ---------------------------------------------------------
 */
router.delete(
    "/:registration_id",
    verifyToken,
    requireRole("soutezici", "user"),
    deleteRegistration
);

export default router;
