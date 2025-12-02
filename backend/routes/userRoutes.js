import express from "express";
import {
    registerUser,
    loginUser,
    getProfile,
    assignRole,
    getUser,
    getUsers,
    deleteUser
} from "../controllers/userController.js";
import {verifyToken} from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected
router.get("/profile", verifyToken, getProfile);
router.get("/", getUsers);        // List users
router.get("/:user_id", getUser);
router.delete("/:user_id", deleteUser); // Delete user

router.post("/:user_id/roles",
    verifyToken,
    requireRole("admin"),
    assignRole
);

export default router;
