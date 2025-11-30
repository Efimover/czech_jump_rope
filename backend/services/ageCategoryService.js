// services/ageCategoryService.js
import { pool } from "../db/index.js";
import { ageCategoryModel } from "../model/AgeCategory.js";

export const ageCategoryService = {
    async getAll() {
        return await ageCategoryModel.getAll(pool);
    },

    async update(id, min_age, max_age) {
        if (min_age < 0) throw new Error("min_age must be >= 0");
        if (max_age !== null && max_age < min_age)
            throw new Error("max_age must be greater than min_age");

        return await ageCategoryModel.update(pool, id, min_age, max_age);
    },
};
