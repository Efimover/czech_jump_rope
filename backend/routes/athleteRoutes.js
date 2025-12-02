import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { createAthleteController } from "../controllers/athleteController.js";

const router = express.Router();

// soutezici přidává závodníky
router.post(
    "/",
    verifyToken,
    requireRole("soutezici"),
    createAthleteController
);

export default router;
