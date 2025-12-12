import { pool } from "../db/index.js";
import {
    validateRegistrationOwnership,
    validateRegistrationIsOpen,
    createAthlete,
    createEntriesForAthlete
} from "../services/athleteService.js";

/**
 * ===========================================
 *  CREATE ATHLETE + ASSIGN DISCIPLINES
 *  POST /api/registrations/:registration_id/athletes
 * ===========================================
 */
export const createAthleteController = async (req, res) => {
    const client = await pool.connect();

    try {
        const { registration_id } = req.params;

        const {
            first_name,
            last_name,
            birth_year,
            gender,
            disciplines
        } = req.body;

        const userId = req.user.id;

        // -------------------------
        // 1️⃣ Ověřit vlastnictví přihlášky
        // -------------------------
        const reg = await validateRegistrationOwnership(userId, registration_id);
        if (!reg) {
            return res.status(403).json({
                error: "Přihláška nepatří přihlášenému uživateli."
            });
        }

        const competition_id = reg.competition_id;

        // -------------------------
        // 2️⃣ Ověřit, zda je otevřené registrační období
        // -------------------------
        const open = await validateRegistrationIsOpen(competition_id);
        if (!open) {
            return res.status(400).json({
                error: "Registrace je uzavřena — nelze přidat závodníka."
            });
        }

        // -------------------------
        // 3️⃣ Validace požadovaných polí
        // -------------------------
        if (!first_name || !last_name) {
            return res.status(400).json({ error: "Jméno a příjmení jsou povinné." });
        }
        if (!birth_year || isNaN(birth_year)) {
            return res.status(400).json({ error: "Rok narození je povinný a musí být číslo." });
        }
        if (!gender) {
            return res.status(400).json({ error: "Pohlaví je povinné." });
        }

        // -------------------------
        // 4️⃣ Zahájit transakci
        // -------------------------
        await client.query("BEGIN");

        // -------------------------
        // 5️⃣ Vytvořit atleta
        // -------------------------
        const athlete = await createAthlete({
            first_name,
            last_name,
            birth_year,
            gender
        });

        // -------------------------
        // 6️⃣ Přiřadit disciplíny (pokud nějaké jsou)
        // -------------------------
        if (Array.isArray(disciplines) && disciplines.length > 0) {
            await createEntriesForAthlete({
                registration_id,
                competition_id,
                athlete_id: athlete.athlete_id,
                birth_year,
                disciplines
            });
        }

        // -------------------------
        // 7️⃣ Potvrdit transakci
        // -------------------------
        await client.query("COMMIT");

        return res.status(201).json({
            status: "success",
            message: "Závodník byl úspěšně přidán.",
            athlete
        });

    } catch (err) {
        console.error("createAthleteController error:", err);

        await client.query("ROLLBACK");

        return res.status(400).json({
            status: "error",
            error: err.message || "Nelze přidat závodníka."
        });
    } finally {
        client.release();
    }
};


/**
 * ===========================================
 *  GET ATHLETES FOR ONE REGISTRATION
 *  GET /api/registrations/:registration_id/athletes
 * ===========================================
 */
export const getAthletesForRegistration = async (req, res) => {
    try {
        const { registration_id } = req.params;

        const result = await pool.query(
            `
                SELECT
                    a.athlete_id,
                    a.first_name,
                    a.last_name,
                    a.birth_year,
                    a.gender,
                    COALESCE(
                                    json_agg(
                                    json_build_object(
                                            'discipline_id', d.discipline_id,
                                            'name', d.name
                                    )
                                            ) FILTER (WHERE d.discipline_id IS NOT NULL),
                                    '[]'
                    ) AS disciplines
                FROM athlete a
                         LEFT JOIN entry e ON e.athlete_id = a.athlete_id
                         LEFT JOIN discipline d ON d.discipline_id = e.discipline_id
                WHERE a.athlete_id IN (
                    SELECT athlete_id FROM entry WHERE registration_id = $1
                )
                GROUP BY a.athlete_id
                ORDER BY a.last_name, a.first_name;
            `,
            [registration_id]
        );

        return res.json(result.rows);

    } catch (err) {
        console.error("getAthletesForRegistration error:", err);
        return res.status(500).json({ error: "Server error" });
    }
};
