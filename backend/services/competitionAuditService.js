import { pool } from "../db/index.js";

export async function logCompetitionAction({
                                               competition_id,
                                               actor_user_id,
                                               actor_role,
                                               action,
                                               message = null
                                           }) {
    await pool.query(
        `
        INSERT INTO competition_audit
            (competition_id, actor_user_id, actor_role, action, message)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
            competition_id,
            actor_user_id,
            actor_role,
            action,
            message
        ]
    );
}
