import express from "express";
import {
    createDiscipline,
    assignDisciplineToCompetition,
    getDisciplinesByCompetition,
    updateDiscipline,
    deleteDiscipline,
    getAllDisciplines
} from "../controllers/disciplineController.js";

const router = express.Router();

//get All disciplines
router.get("/", getAllDisciplines);

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
