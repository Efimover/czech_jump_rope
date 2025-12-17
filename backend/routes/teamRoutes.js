import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
    createTeam,
    getTeamsByRegistration
} from "../controllers/teamController.js";

const router = express.Router();

router.get(
    "/by-registration/:registration_id",
    verifyToken,
    getTeamsByRegistration
);

router.post(
    "/by-registration/:registration_id",
    verifyToken,
    requireRole("soutezici", "user"),
    createTeam
);

export default router;
