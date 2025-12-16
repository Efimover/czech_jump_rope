import { pool } from "../db/index.js";
import {
    validateRegistrationOwnership,
    validateRegistrationIsOpen,
    createAthlete,

} from "../services/athleteService.js";


export const getAthletesByTeam = async (req, res) => {
    const { team_id } = req.params;

    try {
        const result = await pool.query(
            `
      SELECT a.*
      FROM athlete a
      JOIN team_athlete ta ON ta.athlete_id = a.athlete_id
      WHERE ta.team_id = $1
      `,
            [team_id]
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

    try {
        const athleteRes = await pool.query(
            `
      INSERT INTO athlete (first_name, last_name, birth_year, gender)
      VALUES ($1, $2, $3, $4)
      RETURNING athlete_id
      `,
            [first_name, last_name, birth_year, gender]
        );

        await pool.query(
            `
      INSERT INTO team_athlete (team_id, athlete_id)
      VALUES ($1, $2)
      `,
            [team_id, athleteRes.rows[0].athlete_id]
        );

        res.status(201).json({ success: true });
    } catch (err) {
        console.error("createAthleteForTeam error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


