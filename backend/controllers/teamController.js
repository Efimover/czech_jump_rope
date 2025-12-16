import { pool } from "../db/index.js";

export const getTeamsByRegistration = async (req, res) => {
    const { registration_id } = req.params;

    try {
        const result = await pool.query(
            `
      SELECT team_id, name, created_at
      FROM team
      WHERE registration_id = $1
      ORDER BY created_at
      `,
            [registration_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("getTeamsByRegistration error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const createTeam = async (req, res) => {
    const { registration_id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Název týmu je povinný" });
    }

    try {
        // ⚠️ kontrola stavu registrace
        const reg = await pool.query(
            `SELECT status FROM registration WHERE registration_id = $1`,
            [registration_id]
        );

        if (reg.rowCount === 0) {
            return res.status(404).json({ error: "Registrace neexistuje" });
        }

        if (reg.rows[0].status === "submitted") {
            return res.status(403).json({
                error: "Odeslanou přihlášku nelze upravovat"
            });
        }

        const result = await pool.query(
            `
      INSERT INTO team (registration_id, name)
      VALUES ($1, $2)
      RETURNING team_id, name
      `,
            [registration_id, name]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("createTeam error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
