import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
    getEntriesByRegistration,
    upsertEntry,
    deleteEntry,
    autoAssignEntry
} from "../controllers/entryController.js";

const router = express.Router();

router.get(
    "/by-registration/:registration_id",
    verifyToken,
    getEntriesByRegistration
);

router.post(
    "/",
    verifyToken,
    requireRole("soutezici", "user"),
    upsertEntry
);

router.delete(
    "/:entry_id",
    verifyToken,
    requireRole("soutezici", "user"),
    deleteEntry
);

router.post(
    "/auto-assign",
    verifyToken,
    requireRole("soutezici", "user"),
    autoAssignEntry
);

export default router;
