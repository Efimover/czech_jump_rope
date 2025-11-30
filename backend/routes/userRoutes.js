import express from "express";
import { registerUser, loginUser, getProfile } from "../controllers/userController.js";
import {verifyToken} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected
router.get("/profile", verifyToken, getProfile);

export default router;
