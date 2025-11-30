// routes/ageCategoryRoutes.js
import express from "express";
import {createAgeCategory, getAgeCategories, updateAgeCategory} from "../controllers/ageCategoryController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getAgeCategories);

// PUT /api/age-categories/:id — jen admin
router.put("/:id", verifyToken, requireRole("admin"), updateAgeCategory);
router.post("/", verifyToken, requireRole("admin"), createAgeCategory);

export default router;
