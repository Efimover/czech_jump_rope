import { pool } from "../db/index.js";

/**
 * Vytvořit disciplínu + její věkové kategorie
 */
export const createDiscipline = async (req, res) => {
    const { name, pocet_athletes, is_team, type, age_categories } = req.body;

    if (!name || !type) {
        return res.status(400).json({ error: "Missing required fields (name, type)." });
    }

    try {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const insertDiscipline = `
                INSERT INTO discipline (name, pocet_athletes, is_team, type)
                VALUES ($1, $2, $3, $4)
                RETURNING discipline_id;
            `;

            const result = await client.query(insertDiscipline, [
                name,
                pocet_athletes || null,
                is_team || false,
                type
            ]);

            const disciplineId = result.rows[0].discipline_id;

            // pokud jsou definované věkové kategorie
            if (Array.isArray(age_categories)) {
                for (const categoryId of age_categories) {
                    await client.query(
                        `INSERT INTO discipline_age_category (discipline_id, age_category_id)
                         VALUES ($1, $2)
                         ON CONFLICT DO NOTHING`,
                        [disciplineId, categoryId]
                    );
                }
            }

            await client.query("COMMIT");

            res.status(201).json({
                message: "Discipline created successfully",
                discipline_id: disciplineId
            });

        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Error creating discipline:", err);
        res.status(500).json({ error: "Server error" });
    }
};


/**
 * Přiřadit disciplínu soutěži (competition_discipline)
 */
export const assignDisciplineToCompetition = async (req, res) => {
    const { competition_id, discipline_id } = req.body;

    if (!competition_id || !discipline_id) {
        return res.status(400).json({ error: "Missing competition_id or discipline_id" });
    }

    try {
        await pool.query(
            `INSERT INTO competition_discipline (competition_id, discipline_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [competition_id, discipline_id]
        );

        res.status(201).json({ message: "Discipline assigned to competition." });

    } catch (err) {
        console.error("Error assigning discipline:", err);
        res.status(500).json({ error: "Server error" });
    }
};


/**
 * Získat disciplíny pro danou soutěž
 */
export const getDisciplinesByCompetition = async (req, res) => {
    const { competitionId } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT d.*, 
                   json_agg(ac.age_category_id) AS age_categories
            FROM competition_discipline cd
            JOIN discipline d ON d.discipline_id = cd.discipline_id
            LEFT JOIN discipline_age_category ac ON ac.discipline_id = d.discipline_id
            WHERE cd.competition_id = $1
            GROUP BY d.discipline_id
            `,
            [competitionId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error("Error fetching competition disciplines:", err);
        res.status(500).json({ error: "Server error" });
    }
};


/**
 * Upravit disciplínu
 */
export const updateDiscipline = async (req, res) => {
    const { id } = req.params;
    const { name, pocet_athletes, is_team, type, age_categories } = req.body;

    try {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await client.query(
                `
                UPDATE discipline 
                SET 
                    name = $1,
                    pocet_athletes = $2,
                    is_team = $3,
                    type = $4
                WHERE discipline_id = $5
                `,
                [name, pocet_athletes, is_team, type, id]
            );

            // Smazat staré věkové kategorie
            await client.query(
                `DELETE FROM discipline_age_category WHERE discipline_id = $1`,
                [id]
            );

            // Přidat nové
            if (Array.isArray(age_categories)) {
                for (const cat of age_categories) {
                    await client.query(
                        `INSERT INTO discipline_age_category (discipline_id, age_category_id)
                         VALUES ($1, $2)`,
                        [id, cat]
                    );
                }
            }

            await client.query("COMMIT");

            res.json({ message: "Discipline updated" });

        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Error updating discipline:", err);
        res.status(500).json({ error: "Server error" });
    }
};


/**
 * Smazat disciplínu
 */
export const deleteDiscipline = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            `DELETE FROM discipline WHERE discipline_id = $1`,
            [id]
        );

        res.json({ message: "Discipline deleted" });

    } catch (err) {
        console.error("Error deleting discipline:", err);
        res.status(500).json({ error: "Server error" });
    }
};
