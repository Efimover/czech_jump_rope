import express from "express";
import {
    createDiscipline,
    assignDisciplineToCompetition,
    getDisciplinesByCompetition,
    updateDiscipline,
    deleteDiscipline
} from "../controllers/disciplineController.js";

const router = express.Router();

// vytvořit disciplínu
router.post("/", createDiscipline);

// přiřadit disciplínu soutěži
router.post("/assign", assignDisciplineToCompetition);

// seznam disciplín pro soutěž
router.get("/competition/:competitionId", getDisciplinesByCompetition);

// upravit disciplínu
router.put("/:id", updateDiscipline);

// smazat disciplínu
router.delete("/:id", deleteDiscipline);

export default router;
