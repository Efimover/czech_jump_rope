import { pool } from "../db/index.js";
import {
    validateRegistrationOwnership,
    validateRegistrationIsOpen,
    createAthlete,

} from "../services/athleteService.js";
import { validateBirthYearForCompetition } from "../utils/validation.js";

export const getAthletesByTeam = async (req, res) => {
    const { team_id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `
                SELECT a.*
                FROM athlete a
                         JOIN team_athlete ta ON ta.athlete_id = a.athlete_id
                         JOIN team t ON t.team_id = ta.team_id
                         JOIN registration r ON r.registration_id = t.registration_id
                WHERE ta.team_id = $1
                  AND r.user_id = $2
            `,
            [team_id, userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("getAthletesByTeam error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const createAthleteForTeam = async (req, res) => {
    const { team_id } = req.params;
    const { first_name, last_name, birth_year, gender } = req.body;
    const userId = req.user.user_id;

    try {
        // 1️⃣ ověř, že tým patří uživateli a registrace není submitted
        const teamRes = await pool.query(
            `
                SELECT r.registration_id
                FROM team t
                         JOIN registration r ON r.registration_id = t.registration_id
                WHERE t.team_id = $1
                  AND r.user_id = $2
                  AND r.status != 'submitted'
            `,
            [team_id, userId]
        );

        if (teamRes.rowCount === 0) {
            return res.status(403).json({
                error: "Nelze přidat závodníka do tohoto týmu"
            });
        }

        // 2️⃣ vytvoř atleta
        const athleteRes = await pool.query(
            `
            INSERT INTO athlete (first_name, last_name, birth_year, gender)
            VALUES ($1, $2, $3, $4)
            RETURNING athlete_id
            `,
            [first_name, last_name, birth_year, gender]
        );

        const athleteId = athleteRes.rows[0].athlete_id;

        // 3️⃣ přiřaď atleta do týmu
        await pool.query(
            `
                INSERT INTO team_athlete (team_id, athlete_id)
                VALUES ($1, $2)
            `,
            [team_id, athleteId]
        );

        res.status(201).json({
            athlete_id: athleteId
        });

    } catch (err) {
        console.error("createAthleteForTeam error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const deleteAthlete = async (req, res) => {
    const { athlete_id } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `
            DELETE FROM athlete
            USING team_athlete ta
            JOIN team t ON t.team_id = ta.team_id
            JOIN registration r ON r.registration_id = t.registration_id
            WHERE athlete.athlete_id = $1
              AND athlete.athlete_id = ta.athlete_id
              AND r.user_id = $2
              AND r.status != 'submitted'
            RETURNING athlete.athlete_id
            `,
            [athlete_id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Nelze smazat závodníka" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("deleteAthlete error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const getAthleteById = async (req, res) => {
    const { athlete_id } = req.params;
    const userId = req.user.user_id;

    const result = await pool.query(
        `
        SELECT a.*
        FROM athlete a
        JOIN team_athlete ta ON ta.athlete_id = a.athlete_id
        JOIN team t ON t.team_id = ta.team_id
        JOIN registration r ON r.registration_id = t.registration_id
        WHERE a.athlete_id = $1
          AND r.user_id = $2
        `,
        [athlete_id, userId]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ error: "Závodník nenalezen" });
    }

    res.json(result.rows[0]);
};

export const updateAthlete = async (req, res) => {
    const { athlete_id } = req.params;
    const { first_name, last_name, birth_year, gender } = req.body;
    const userId = req.user.user_id;
    // zjisti rok soutěže
    const compRes = await pool.query(
        `
            SELECT EXTRACT(YEAR FROM start_date)::int AS year
            FROM competition
                     JOIN registration r ON r.competition_id = competition.competition_id
            WHERE r.registration_id = $1
        `,
        [registration_id]
    );

    const competitionYear = compRes.rows[0].year;

// validace
    const birthError = validateBirthYearForCompetition(
        birth_year,
        competitionYear
    );

    if (birthError) {
        return res.status(400).json({
            code: "INVALID_BIRTH_YEAR",
            error: birthError
        });
    }

    const result = await pool.query(
        `
        UPDATE athlete a
        SET first_name = $1,
            last_name = $2,
            birth_year = $3,
            gender = $4
            
        FROM team_athlete ta
        JOIN team t ON t.team_id = ta.team_id
        JOIN registration r ON r.registration_id = t.registration_id
        WHERE a.athlete_id = $5
          AND a.athlete_id = ta.athlete_id
          AND r.user_id = $6
          AND r.status != 'submitted'
        RETURNING a.*
        `,
        [first_name, last_name, birth_year, gender, athlete_id, userId]
    );

    if (result.rowCount === 0) {
        return res.status(403).json({
            error: "Nelze upravit závodníka"
        });
    }

    res.json(result.rows[0]);
};




