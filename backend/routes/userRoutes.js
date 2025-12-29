import express from "express";
import {
    registerUser,
    loginUser,
    assignRole,
    getUser,
    getUsers,
    deleteUser,
    getMe,
    updateMe,
    changePassword, switchActiveRole, loginWithGoogle
} from "../controllers/userController.js";
import { validateRegister } from "../middleware/validateRegister.js";
import {verifyToken} from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public
router.post("/register", validateRegister, registerUser);
router.post("/login", loginUser);

// 👤 PROFIL PŘIHLÁŠENÉHO UŽIVATELE
router.get("/me", verifyToken, getMe);
router.put("/me", verifyToken, updateMe);
router.put("/me/password", verifyToken, changePassword);

// Protected

router.get("/", getUsers);        // List users
router.get("/:user_id", getUser);
router.delete("/:user_id", deleteUser); // Delete user
router.put("/:user_id", verifyToken, updateMe);

router.put(
    "/me/active-role",
    verifyToken,
    switchActiveRole
);

router.post("/:user_id/roles",
    verifyToken,
    requireRole("admin"),
    assignRole
);

router.post("/auth/google", loginWithGoogle);

export default router;
