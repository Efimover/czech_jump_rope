// models/AgeCategory.js
export const ageCategoryModel = {
    async getAll(pool) {
        const result = await pool.query(
            `SELECT age_category_id, code, name, min_age, max_age
             FROM age_category
             ORDER BY min_age ASC`
        );
        return result.rows;
    },

    async update(pool, id, min_age, max_age) {
        const result = await pool.query(
            `UPDATE age_category
             SET min_age = $1, max_age = $2
             WHERE age_category_id = $3
             RETURNING age_category_id, code, name, min_age, max_age`,
            [min_age, max_age, id]
        );
        return result.rows[0];
    },
};
