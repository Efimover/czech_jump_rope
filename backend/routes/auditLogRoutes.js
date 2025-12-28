import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {getRegistrationAuditLog} from "../controllers/auditLogController.js";
const router = express.Router();

router.get(
    "/:registration_id/audit-log",
    verifyToken,
    getRegistrationAuditLog
);

export default router;