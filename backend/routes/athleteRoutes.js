import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {createAthleteController, getAthletesForRegistration} from "../controllers/athleteController.js";

const router = express.Router();

// přidat závodníka k přihlášce
router.post(
    "/:registration_id/athletes",
    verifyToken,
    createAthleteController
);
router.get(
    "/by-registration/:registration_id",
    verifyToken,
    getAthletesForRegistration
);
export default router;
