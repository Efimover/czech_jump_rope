import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

import {createRegistration, getRegistration} from "../controllers/registrationController.js";

const router = express.Router();

router.get("/:registration_id", verifyToken, getRegistration);
router.post(
    "/",
    verifyToken,
    requireRole("soutezici"),
    createRegistration
);

export default router;

