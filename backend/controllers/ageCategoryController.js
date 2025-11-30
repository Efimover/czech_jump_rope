// controllers/ageCategoryController.js
import { ageCategoryService } from "../services/ageCategoryService.js";

export const getAgeCategories = async (req, res) => {
    try {
        const categories = await ageCategoryService.getAll();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateAgeCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { min_age, max_age } = req.body;

        const updated = await ageCategoryService.update(id, min_age, max_age);

        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const createAgeCategory = async (req, res) => {
    try {
        const { code, name, min_age, max_age } = req.body;

        const result = await pool.query(
            `INSERT INTO age_category (code, name, min_age, max_age)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [code, name, min_age, max_age]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Create Age Category error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
