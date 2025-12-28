import { pool } from "../db/index.js";

import {
    verifyEditableRegistration,
    getValidDiscipline
} from "../services/entryService.js";

import {
    validateAgeCategory,
    validateTeamCapacity
} from "../utils/entryValidation.js";
export const getEntriesByRegistration = async (req, res) => {
    const { registration_id } = req.params;
    const userId = req.user.user_id;
    const role = req.user.active_role;

    let query = `
        SELECT e.*
        FROM entry e
        JOIN registration r ON r.registration_id = e.registration_id
        JOIN competition c ON c.competition_id = r.competition_id
        WHERE e.registration_id = $1
    `;

    const params = [registration_id];

    if (role === "soutezici" || role === "user") {
        query += " AND r.user_id = $2";
        params.push(userId);
    }

    if (role === "organizator") {
        query += " AND c.owner_id = $2";
        params.push(userId);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
};


export const upsertEntry = async (req, res) => {
    const {
        registration_id,
        athlete_id,
        competition_discipline_id,
        is_selected,
        team_group
    } = req.body;

    try {
        await verifyEditableRegistration(registration_id, req.user.user_id);

        const { discipline_id, is_team, pocet_athletes } =
            await getValidDiscipline(competition_discipline_id, registration_id);

        if (!is_team && team_group !== null)
            return res.status(400).json({ error: "Individuální disciplína nesmí mít tým" });

        if (is_team && !team_group)
            return res.status(400).json({ error: "Týmová disciplína vyžaduje číslo týmu" });

        await validateAgeCategory(athlete_id, registration_id, discipline_id);

        if (is_team && team_group)
            await validateTeamCapacity(
                registration_id,
                discipline_id,
                team_group,
                athlete_id,
                pocet_athletes
            );

        const result = await pool.query(
            `
            INSERT INTO entry (
                registration_id,
                athlete_id,
                discipline_id,
                competition_discipline_id,
                team_group,
                is_selected
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (athlete_id, competition_discipline_id)
            DO UPDATE SET
                team_group = EXCLUDED.team_group,
                is_selected = EXCLUDED.is_selected
            RETURNING *
            `,
            [
                registration_id,
                athlete_id,
                discipline_id,
                competition_discipline_id,
                team_group ?? null,
                is_selected ?? true
            ]
        );

        res.json(result.rows[0]);
    } catch (e) {
        res.status(e.status || 500).json({ error: e.msg || "Server error", code: e.code });
    }
};


export const deleteEntry = async (req, res) => {
    const { entry_id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `
      DELETE FROM entry
      USING registration
      WHERE entry.entry_id = $1
        AND entry.registration_id = registration.registration_id
        AND registration.user_id = $2
        AND registration.status != 'submitted'
      RETURNING entry.entry_id
      `,
            [entry_id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Entry nenalezena nebo nelze smazat"
            });
        }

        res.json({ success: true });

    } catch (err) {
        console.error("deleteEntry error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const autoAssignEntry = async (req, res) => {
    const { registration_id, athlete_id, competition_discipline_id } = req.body;
    const userId = req.user.user_id;

    try {
        // ověř registraci
        const reg = await pool.query(
            `SELECT status FROM registration WHERE registration_id=$1 AND user_id=$2`,
            [registration_id, userId]
        );

        if (reg.rowCount === 0 || reg.rows[0].status === "submitted") {
            return res.status(403).json({ error: "Nelze upravovat" });
        }

        // získej discipline_id + validuj soutěž
        const cdRes = await pool.query(
            `
                SELECT d.discipline_id, d.is_team, d.pocet_athletes
                FROM competition_discipline cd
                         JOIN discipline d ON d.discipline_id = cd.discipline_id
                         JOIN registration r ON r.competition_id = cd.competition_id
                WHERE cd.id = $1
                  AND r.registration_id = $2
            `,
            [competition_discipline_id, registration_id]
        );

        if (cdRes.rowCount === 0) {
            return res.status(400).json({ error: "Neplatná disciplína" });
        }

        const { discipline_id, is_team, pocet_athletes } = cdRes.rows[0];

        // 🔹 načti závodníka
        const athleteRes = await pool.query(
            `SELECT birth_year FROM athlete WHERE athlete_id = $1`,
            [athlete_id]
        );

        if (athleteRes.rowCount === 0) {
            return res.status(404).json({ error: "Závodník neexistuje" });
        }

        const birthYear = athleteRes.rows[0].birth_year;

// 🔹 rok soutěže
        const compRes = await pool.query(
            `
    SELECT EXTRACT(YEAR FROM c.start_date)::int AS year
    FROM competition c
    JOIN registration r ON r.competition_id = c.competition_id
    WHERE r.registration_id = $1
    `,
            [registration_id]
        );

        const competitionYear = compRes.rows[0].year;
        const age = competitionYear - birthYear;

// 🔹 věkové kategorie disciplíny
        const catRes = await pool.query(
            `
    SELECT ac.min_age, ac.max_age
    FROM discipline_age_category dac
    JOIN age_category ac ON ac.age_category_id = dac.age_category_id
    WHERE dac.discipline_id = $1
    `,
            [discipline_id]
        );

        let valid = true;

        if (catRes.rows.length > 0) {
            valid = catRes.rows.some(c =>
                age >= c.min_age &&
                (c.max_age === null || age <= c.max_age)
            );
        }

        if (!valid) {
            return res.status(400).json({
                code: "AGE_MISMATCH",
                error: "Závodník nesplňuje věkovou kategorii disciplíny"
            });
        }

        // INDIVIDUÁLNÍ
        if (!is_team) {
            const result = await pool.query(
                `
                    INSERT INTO entry (
                        registration_id,
                        athlete_id,
                        discipline_id,
                        competition_discipline_id
                    )
                    VALUES ($1,$2,$3,$4)
                    ON CONFLICT (athlete_id, competition_discipline_id) DO NOTHING
                    RETURNING *
                `,
                [registration_id, athlete_id, discipline_id, competition_discipline_id]
            );

            return res.json(result.rows[0]);
        }

        // TÝMOVÁ – najdi volný tým
        const entriesRes = await pool.query(
            `
                SELECT team_group, COUNT(*)::int AS count
                FROM entry
                WHERE registration_id=$1
                  AND competition_discipline_id=$2
                GROUP BY team_group
            `,
            [registration_id, competition_discipline_id]
        );

        const counts = {};
        entriesRes.rows.forEach(r => (counts[r.team_group] = r.count));

        let group = 1;
        while ((counts[group] || 0) >= pocet_athletes) {
            group++;
        }

        const result = await pool.query(
            `
                INSERT INTO entry (
                    registration_id,
                    athlete_id,
                    discipline_id,
                    competition_discipline_id,
                    team_group
                )
                VALUES ($1,$2,$3,$4,$5)
                RETURNING *
            `,
            [registration_id, athlete_id, discipline_id, competition_discipline_id, group]
        );

        res.json(result.rows[0]);

    } catch (err) {
        console.error("autoAssignEntry error:", err);
        res.status(500).json({ error: "Server error" });
    }
};