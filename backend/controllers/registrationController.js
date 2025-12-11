import { pool } from "../db/index.js";
export const getRegistration = async (req, res) => {
    try {
        const { registration_id } = req.params;

        const reg = await pool.query(
            `SELECT r.*, c.name AS competition_name
     FROM registration r
     JOIN competition c ON c.competition_id = r.competition_id
     WHERE r.registration_id = $1`,
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

        // 1️⃣ Už existuje přihláška?
        const existing = await pool.query(
            `SELECT registration_id
             FROM registration
             WHERE competition_id = $1 AND user_id = $2`,
            [competition_id, userId]
        );

        if (existing.rowCount > 0) {
            return res.status(409).json({
                status: "error",
                message: "Přihláška již existuje pro tuto soutěž.",
                registration_id: existing.rows[0].registration_id
            });
        }

        // 2️⃣ Kontrola existence soutěže
        const comp = await pool.query(
            `SELECT reg_start, reg_end FROM competition WHERE competition_id = $1`,
            [competition_id]
        );

        if (comp.rowCount === 0) {
            return res.status(404).json({
                status: "error",
                message: "Soutěž nebyla nalezena."
            });
        }

        const { reg_start, reg_end } = comp.rows[0];
        const today = new Date();

        // 3️⃣ Přihlašování povoleno?
        if (today < new Date(reg_start) || today > new Date(reg_end)) {
            return res.status(400).json({
                status: "error",
                message: "Registrace do soutěže není aktuálně otevřena."
            });
        }

        // 4️⃣ Vytvoření přihlášky
        const result = await pool.query(
            `INSERT INTO registration (competition_id, user_id, contact_name, contact_email)
             VALUES ($1, $2, $3, $4)
             RETURNING registration_id, status, created_at`,
            [competition_id, userId, contact_name, contact_email]
        );

        return res.status(201).json({
            status: "success",
            message: "Přihláška vytvořena.",
            registration: result.rows[0]
        });

    } catch (err) {
        console.error("Create registration error:", err);
        return res.status(500).json({
            status: "error",
            message: "Došlo k chybě serveru. Zkuste to prosím znovu."
        });
    }
};
