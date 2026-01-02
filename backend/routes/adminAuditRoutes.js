import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { getAdminAuditLog } from "../controllers/adminAuditController.js";

const router = express.Router();

router.get(
    "/audit-log",
    verifyToken,
    requireRole("admin"),
    getAdminAuditLog
);

export default router;
