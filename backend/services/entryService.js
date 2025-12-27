import { pool } from "../db/index.js";

export const getValidDiscipline = async (competition_discipline_id, registration_id) => {
    const res = await pool.query(
        `
        SELECT d.discipline_id, d.is_team, d.pocet_athletes
        FROM competition_discipline cd
        JOIN discipline d ON d.discipline_id = cd.discipline_id
        JOIN registration r ON r.competition_id = cd.competition_id
        WHERE cd.id = $1 AND r.registration_id = $2
        `,
        [competition_discipline_id, registration_id]
    );

    if (!res.rowCount) throw { status: 400, msg: "Neplatná disciplína" };
    return res.rows[0];
};

export const verifyEditableRegistration = async (registration_id, user_id) => {
    const res = await pool.query(
        `SELECT status FROM registration WHERE registration_id=$1 AND user_id=$2`,
        [registration_id, user_id]
    );

    if (!res.rowCount) throw { status: 403, msg: "Nepovolený přístup" };
    if (res.rows[0].status === "submitted")
        throw { status: 403, msg: "Odeslanou přihlášku nelze upravovat" };
};
