import { pool } from "../db/index.js";

// 1️⃣ Ověří, zda registrace patří přihlášenému uživateli
export const validateRegistrationOwnership = async (user_id, registration_id) => {
    const reg = await pool.query(
        `SELECT * FROM registration WHERE registration_id = $1 AND user_id = $2`,
        [registration_id, user_id]
    );

    return reg.rows[0] || null;
};

// 2️⃣ Ověří, zda je otevřené registrační období
export const validateRegistrationIsOpen = async (competition_id) => {
    const comp = await pool.query(
        `SELECT reg_start, reg_end FROM competition WHERE competition_id = $1`,
        [competition_id]
    );

    if (comp.rowCount === 0) return false;

    const { reg_start, reg_end } = comp.rows[0];
    const today = new Date();

    return !(today < new Date(reg_start) || today > new Date(reg_end));
};

// 3️⃣ Uloží atleta
export const createAthlete = async ({ first_name, last_name, birth_year, gender }) => {
    const result = await pool.query(
        `INSERT INTO athlete (first_name, last_name, birth_year, gender)
         VALUES ($1, $2, $3, $4)
         RETURNING athlete_id, first_name, last_name, birth_year, gender`,
        [first_name, last_name, birth_year, gender]
    );

    return result.rows[0];
};

// 4️⃣ Přiřadí disciplíny atletovi (entry)
export const createEntriesForAthlete = async ({
                                                  registration_id,
                                                  competition_id,
                                                  athlete_id,
                                                  birth_year,
                                                  disciplines
                                              }) => {
    for (const discipline_id of disciplines) {

        // Ověřit, zda disciplína patří soutěži
        const valid = await pool.query(
            `SELECT 1 FROM competition_discipline 
             WHERE competition_id = $1 AND discipline_id = $2`,
            [competition_id, discipline_id]
        );

        if (valid.rowCount === 0) {
            throw new Error("Selected discipline is not part of this competition.");
        }

        await pool.query(
            `INSERT INTO entry (registration_id, athlete_id, discipline_id)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [registration_id, athlete_id, discipline_id]
        );
    }
};
