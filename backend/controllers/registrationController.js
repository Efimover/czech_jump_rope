import { pool } from "../db/index.js";
export const getRegistration = async (req, res) => {
    try {
        const { registration_id } = req.params;

        const reg = await pool.query(
            `SELECT * FROM registration WHERE registration_id = $1`,
            [registration_id]
        );

        if (reg.rowCount === 0) {
            return res.status(404).json({ error: "Registration not found" });
        }

        return res.json(reg.rows[0]);

    } catch (err) {
        console.error("getRegistration error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const createRegistration = async (req, res) => {
    try {
        const { competition_id, contact_name, contact_email } = req.body;
        const userId = req.user.id;

        // 1️⃣ Zkontroluj existující přihlášku
        const existing = await pool.query(
            `SELECT registration_id
             FROM registration
             WHERE competition_id = $1 AND user_id = $2`,
            [competition_id, userId]
        );

        if (existing.rowCount > 0) {
            return res.status(400).json({
                error: "Registration already exists for this competition",
                registration_id: existing.rows[0].registration_id
            });
        }

        // 2️⃣ Soutěž existuje?
        const comp = await pool.query(
            `SELECT reg_start, reg_end FROM competition WHERE competition_id = $1`,
            [competition_id]
        );

        if (comp.rowCount === 0) {
            return res.status(404).json({ error: "Competition not found" });
        }

        const { reg_start, reg_end } = comp.rows[0];
        const today = new Date();

        // 3️⃣ Registrace otevřená?
        if (today < new Date(reg_start) || today > new Date(reg_end)) {
            return res.status(400).json({ error: "Registration period is closed" });
        }

        // 4️⃣ Vytvoření přihlášky
        const result = await pool.query(
            `INSERT INTO registration (competition_id, user_id, contact_name, contact_email)
             VALUES ($1, $2, $3, $4)
             RETURNING registration_id, status, created_at`,
            [competition_id, userId, contact_name, contact_email]
        );

        res.status(201).json({
            message: "Registration created",
            registration: result.rows[0]
        });

    } catch (err) {
        console.error("Create registration error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
