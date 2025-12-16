import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
    getEntriesByRegistration,
    upsertEntry,
    deleteEntry
} from "../controllers/entryController.js";

const router = express.Router();

/**
 * GET entries pro registraci
 */
router.get(
    "/by-registration/:registration_id",
    verifyToken,
    getEntriesByRegistration
);

/**
 * INSERT / UPDATE entry
 */
router.post(
    "/",
    verifyToken,
    requireRole("soutezici", "user"),
    upsertEntry
);

/**
 * DELETE entry
 */
router.delete(
    "/:entry_id",
    verifyToken,
    requireRole("soutezici", "user"),
    deleteEntry
);

export default router;
