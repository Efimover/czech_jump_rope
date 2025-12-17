import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {

    createAthleteForTeam, getAthletesByTeam, deleteAthlete, getAthleteById, updateAthlete

} from "../controllers/athleteController.js";
import {requireRole} from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
    "/by-team/:team_id",
    verifyToken,
    getAthletesByTeam
);

router.post(
    "/by-team/:team_id",
    verifyToken,
    requireRole("soutezici", "user"),
    createAthleteForTeam
);

router.delete(
    "/:athlete_id",
    verifyToken,
    requireRole("soutezici", "user"),
    deleteAthlete
);

router.get(
    "/:athlete_id",
    verifyToken,
    getAthleteById
);

router.put(
    "/:athlete_id",
    verifyToken,
    requireRole("soutezici", "user"),
    updateAthlete
);
export default router;
