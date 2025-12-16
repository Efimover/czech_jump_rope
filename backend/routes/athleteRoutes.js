import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {

    createAthleteForTeam, getAthletesByTeam,

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
export default router;
