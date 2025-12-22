import express from "express";
import {
    createDiscipline,
    assignDisciplineToCompetition,
    getDisciplinesByCompetition,
    updateDiscipline,

    getAllDisciplines, removeDisciplineFromCompetition
} from "../controllers/disciplineController.js";
import {verifyToken} from "../middleware/authMiddleware.js";
import {requireRole} from "../middleware/roleMiddleware.js";
import {requireCompetitionOwnerOrAdmin, requireCompetitionOwnerOrAdminByCD} from "../middleware/competitionAccess.js";

const router = express.Router();

//get All disciplines
router.get("/", getAllDisciplines);

// vytvořit disciplínu
router.post("/", verifyToken, requireRole("admin", "organizator"), requireCompetitionOwnerOrAdmin, createDiscipline);

// přiřadit disciplínu soutěži
router.post("/assign", verifyToken, requireRole("admin", "organizator"), requireCompetitionOwnerOrAdmin, assignDisciplineToCompetition);

// seznam disciplín pro soutěž
router.get("/competition/:competitionId", getDisciplinesByCompetition);

// upravit disciplínu
router.put(
    "/competition/:competitionDisciplineId",
    verifyToken,
    requireRole("admin", "organizator"),
    requireCompetitionOwnerOrAdminByCD,
    updateDiscipline
);

// smazat disciplínu z souteze
router.post("/unassign", verifyToken, requireRole("admin", "organizator"), removeDisciplineFromCompetition);

export default router;
