import { pool } from "../db/index.js";

export const validateAgeCategory = async (athlete_id, registration_id, discipline_id) => {
    const athleteRes = await pool.query(
        `SELECT birth_year FROM athlete WHERE athlete_id=$1`,
        [athlete_id]
    );
    if (!athleteRes.rowCount) throw { status: 404, msg: "Závodník neexistuje" };

    const compRes = await pool.query(
        `
        SELECT EXTRACT(YEAR FROM c.start_date)::int AS year
        FROM competition c
        JOIN registration r ON r.competition_id = c.competition_id
        WHERE r.registration_id = $1
        `,
        [registration_id]
    );

    const age = compRes.rows[0].year - athleteRes.rows[0].birth_year;

    const catRes = await pool.query(
        `
        SELECT ac.min_age, ac.max_age
        FROM discipline_age_category dac
        JOIN age_category ac ON ac.age_category_id = dac.age_category_id
        WHERE dac.discipline_id = $1
        `,
        [discipline_id]
    );

    if (
        catRes.rows.length &&
        !catRes.rows.some(c => age >= c.min_age && (!c.max_age || age <= c.max_age))
    ) {
        throw {
            status: 400,
            code: "AGE_MISMATCH",
            msg: "Závodník nesplňuje věkovou kategorii disciplíny"
        };
    }
};

export const validateTeamCapacity = async (
    registration_id,
    discipline_id,
    team_group,
    athlete_id,
    max
) => {
    const res = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM entry
        WHERE registration_id=$1
          AND discipline_id=$2
          AND team_group=$3
          AND athlete_id != $4
        `,
        [registration_id, discipline_id, team_group, athlete_id]
    );

    if (res.rows[0].count >= max) {
        throw {
            status: 400,
            code: "TEAM_FULL",
            msg: `Tým je již plný (max ${max})`
        };
    }
};
