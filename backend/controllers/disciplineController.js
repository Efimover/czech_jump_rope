import { pool } from "../db/index.js";

export const getAllDisciplines = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                discipline_id,
                name,
                type,
                is_team,
                pocet_athletes
            FROM discipline
            ORDER BY name
        `);

        res.json(result.rows);
    } catch (err) {
        console.error("getAllDisciplines error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
/**
 * Vytvořit disciplínu + její věkové kategorie
 */
export const createDiscipline = async (req, res) => {
    const { name, pocet_athletes, is_team, type, age_categories } = req.body;

    if (
        !name ||
        !type ||
        is_team === undefined ||
        (is_team && (!pocet_athletes || pocet_athletes < 2)) ||
        !Array.isArray(age_categories) ||
        age_categories.length === 0
    ) {
        return res.status(400).json({
            error: "Vyplňte všechna povinná pole disciplíny"
        });
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

    // soutěž skončila
    const ended = await pool.query(`
        SELECT 1
        FROM competition
        WHERE competition_id = $1
          AND NOW() > end_date
    `, [competition_id]);

    if (ended.rowCount > 0) {
        return res.status(400).json({
            code: "COMPETITION_ENDED",
            error: "Disciplíny nelze přidat – soutěž již skončila"
        });
    }

    //  existují přihlášky
    const hasEntries = await pool.query(`
        SELECT 1
        FROM entry e
        JOIN registration r ON r.registration_id = e.registration_id
        WHERE r.competition_id = $1
        LIMIT 1
    `, [competition_id]);

    if (hasEntries.rowCount > 0) {
        return res.status(400).json({
            code: "ENTRIES_EXIST",
            error: "Disciplíny nelze přidat – existují přihlášky"
        });
    }

    // lze přidat
    await pool.query(
        `
        INSERT INTO competition_discipline (competition_id, discipline_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [competition_id, discipline_id]
    );

    res.status(201).json({ message: "Discipline assigned to competition." });
};


/**
 * Získat disciplíny pro danou soutěž
 */
export const getDisciplinesByCompetition = async (req, res) => {
    const { competitionId } = req.params;

    try {
        const result = await pool.query(
            `
                SELECT
                    cd.id AS competition_discipline_id,
                    d.discipline_id,
                    d.name,
                    d.type,
                    d.pocet_athletes,
                    d.is_team,

                    -- 🔒 LOCK FLAG
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM entry e
                                     JOIN registration r
                                          ON r.registration_id = e.registration_id
                            WHERE e.competition_discipline_id = cd.id
                              AND r.competition_id = cd.competition_id
                        )
                            THEN true
                        ELSE false
                        END AS locked,

                    COALESCE(
                                    json_agg(ac.name) FILTER (WHERE ac.name IS NOT NULL),
                                    '[]'
                    ) AS age_categories

                FROM competition_discipline cd
                         JOIN discipline d
                              ON d.discipline_id = cd.discipline_id
                         LEFT JOIN discipline_age_category dac
                                   ON dac.discipline_id = d.discipline_id
                         LEFT JOIN age_category ac
                                   ON ac.age_category_id = dac.age_category_id

                WHERE cd.competition_id = $1
                GROUP BY cd.id, d.discipline_id
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
    const { competitionDisciplineId } = req.params;
    const { name, pocet_athletes, is_team, type, age_categories } = req.body;

    // competition_id + discipline_id
    const cdRes = await pool.query(
        `
            SELECT competition_id, discipline_id
            FROM competition_discipline
            WHERE id = $1
        `,
        [competitionDisciplineId]
    );

    if (cdRes.rowCount === 0) {
        return res.status(404).json({ error: "Competition discipline not found" });
    }

    const { competition_id, discipline_id } = cdRes.rows[0];

    // pokud existují přihlášky do teto soutěže a teto disciplíny
    const used = await pool.query(
        `
        SELECT 1
        FROM entry e
        JOIN registration r ON r.registration_id = e.registration_id
        WHERE e.competition_discipline_id = $1
          AND r.competition_id = $2
        LIMIT 1
        `,
        [competitionDisciplineId, competition_id]
    );

    if (used.rowCount > 0) {
        return res.status(400).json({
            code: "DISCIPLINE_LOCKED",
            error: "Disciplínu nelze upravit – existují přihlášky"
        });
    }

    // update JEN této disciplíny v této soutěži
    await pool.query(
        `
        UPDATE discipline
        SET
            name = $1,
            pocet_athletes = $2,
            is_team = $3,
            type = $4
        WHERE discipline_id = $5
        `,
        [name, pocet_athletes, is_team, type, discipline_id]
    );

    // věkové kategorie
    await pool.query(
        `DELETE FROM discipline_age_category WHERE discipline_id = $1`,
        [discipline_id]
    );

    if (Array.isArray(age_categories)) {
        for (const cat of age_categories) {
            await pool.query(
                `
                INSERT INTO discipline_age_category (discipline_id, age_category_id)
                VALUES ($1, $2)
                `,
                [discipline_id, cat]
            );
        }
    }

    res.json({ message: "Discipline updated" });
};


// Smazat disciplinu z souteze
export const removeDisciplineFromCompetition = async (req, res) => {
    const { competition_id, discipline_id } = req.body;

    // zjisti vazbu discipline ↔ competition
    const cdRes = await pool.query(
        `
            SELECT id
            FROM competition_discipline
            WHERE competition_id = $1
              AND discipline_id = $2
        `,
        [competition_id, discipline_id]
    );

    if (cdRes.rowCount === 0) {
        return res.status(404).json({
            error: "Disciplína není přiřazena k této soutěži"
        });
    }

    const competitionDisciplineId = cdRes.rows[0].id;

    // existují přihlášky pro TUTO disciplínu v TÉTO soutěži
    const used = await pool.query(
        `
        SELECT 1
        FROM entry e
        JOIN registration r ON r.registration_id = e.registration_id
        WHERE e.competition_discipline_id = $1
          AND r.competition_id = $2
        LIMIT 1
        `,
        [competitionDisciplineId, competition_id]
    );

    if (used.rowCount > 0) {
        return res.status(400).json({
            code: "DISCIPLINE_IN_USE",
            error: "Disciplínu nelze odebrat – existují přihlášky"
        });
    }

    // soutěž už začala
    const started = await pool.query(
        `
        SELECT 1
        FROM competition
        WHERE competition_id = $1
          AND NOW() >= start_date
        `,
        [competition_id]
    );

    if (started.rowCount > 0) {
        return res.status(400).json({
            code: "COMPETITION_STARTED",
            error: "Po začátku soutěže nelze disciplíny měnit"
        });
    }

    // lze smazat
    await pool.query(
        `
            DELETE FROM competition_discipline
            WHERE id = $1
        `,
        [competitionDisciplineId]
    );

    res.json({ success: true });
};