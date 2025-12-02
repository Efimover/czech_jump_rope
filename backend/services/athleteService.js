import { pool } from "../db/index.js";

// 1️⃣ Ověří, že registrace patří uživateli
export const validateRegistrationOwnership = async (userId, registrationId) => {
    const res = await pool.query(
        `SELECT registration_id, competition_id
         FROM registration
         WHERE registration_id = $1 AND user_id = $2`,
        [registrationId, userId]
    );
    return res.rowCount > 0 ? res.rows[0] : null;
};

// 2️⃣ Zkontroluje, zda je registrace stále otevřená
export const validateRegistrationIsOpen = async (competitionId) => {
    const comp = await pool.query(
        `SELECT reg_start, reg_end
         FROM competition
         WHERE competition_id = $1`,
        [competitionId]
    );

    if (comp.rowCount === 0) return false;

    const { reg_start, reg_end } = comp.rows[0];
    const today = new Date();

    return !(today < new Date(reg_start) || today > new Date(reg_end));
};

// 3️⃣ Vytvoří závodníka
export const createAthlete = async ({ first_name, last_name, birth_year, gender }) => {
    const result = await pool.query(
        `INSERT INTO athlete (first_name, last_name, birth_year, gender)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [first_name, last_name, birth_year, gender]
    );
    return result.rows[0];
};

// 4️⃣ Ověří, že disciplína je součástí soutěže
export const validateDisciplineInCompetition = async (competitionId, disciplineId) => {
    const res = await pool.query(
        `SELECT 1
         FROM competition_discipline
         WHERE competition_id = $1 AND discipline_id = $2`,
        [competitionId, disciplineId]
    );
    return res.rowCount > 0;
};

// 5️⃣ Ověří věkovou kategorii závodníka vůči disciplíně
export const validateAgeCategoryForDiscipline = async (disciplineId, birth_year) => {
    const age = new Date().getFullYear() - birth_year;

    const categories = await pool.query(
        `SELECT ac.min_age, ac.max_age
         FROM discipline_age_category dac
         JOIN age_category ac 
             ON ac.age_category_id = dac.age_category_id
         WHERE dac.discipline_id = $1`,
        [disciplineId]
    );

    // disciplína nemá věkové kategorie → povoleno
    if (categories.rowCount === 0) return true;

    return categories.rows.some(cat =>
        age >= cat.min_age && (cat.max_age === null || age <= cat.max_age)
    );
};

// 6️⃣ Ověří typ disciplíny (individuální vs týmová)
export const validateDisciplineIsIndividual = async (disciplineId) => {
    const res = await pool.query(
        `SELECT is_team FROM discipline WHERE discipline_id = $1`,
        [disciplineId]
    );

    if (res.rowCount === 0) return false;
    return res.rows[0].is_team === false;
};

// 7️⃣ Vytvoří entries závodníka (v transakci)
export const createEntriesForAthlete = async ({
                                                  registration_id,
                                                  competition_id,
                                                  athlete_id,
                                                  birth_year,
                                                  disciplines
                                              }) => {

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const disciplineId of disciplines) {

            // A) disciplína patří soutěži?
            const validDiscipline = await validateDisciplineInCompetition(
                competition_id,
                disciplineId
            );
            if (!validDiscipline) {
                throw new Error(`Discipline ${disciplineId} is not part of this competition.`);
            }

            // B) individuální disciplína?
            const isIndividual = await validateDisciplineIsIndividual(disciplineId);
            if (!isIndividual) {
                throw new Error(`Discipline ${disciplineId} is a team discipline and can't be assigned to an individual athlete.`);
            }

            // C) věková kategorie
            const ageAllowed = await validateAgeCategoryForDiscipline(disciplineId, birth_year);
            if (!ageAllowed) {
                throw new Error(`Athlete's age does not match required age category for discipline ${disciplineId}.`);
            }

            // D) vlož entry
            await client.query(
                `INSERT INTO entry (registration_id, athlete_id, discipline_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (athlete_id, discipline_id) DO NOTHING`,
                [registration_id, athlete_id, disciplineId]
            );
        }

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};
