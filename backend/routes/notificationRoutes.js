import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
    getMyNotifications,
    markAsRead
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/me", verifyToken, getMyNotifications);
router.post("/:id/read", verifyToken, markAsRead);

export default router;