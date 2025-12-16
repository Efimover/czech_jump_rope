import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
    createTeam,
    getTeamsByRegistration
} from "../controllers/teamController.js";

const router = express.Router();

router.get(
    "/teams/:team_id/athletes",
    verifyToken,
    getTeamsByRegistration
);

router.post(
    "/teams/:team_id/athletes",
    verifyToken,
    requireRole("soutezici", "user"),
    createTeam
);

export default router;