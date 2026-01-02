import { pool } from "../db/index.js";

export const getAdminAuditLog = async (req, res) => {
    const result = await pool.query(`
        SELECT
            'competition' AS entity_type,
            ca.competition_id AS entity_id,
            c.name AS entity_name,
            ca.action,
            ca.actor_role,
            u.email AS actor_email,
            ca.message,
            ca.created_at
        FROM competition_audit ca
        JOIN competition c ON c.competition_id = ca.competition_id
        JOIN user_account u ON u.user_id = ca.actor_user_id

        UNION ALL

        SELECT
            'registration' AS entity_type,
            ra.registration_id AS entity_id,
            c.name AS entity_name,
            ra.action,
            ra.actor_role,
            u.email AS actor_email,
            ra.message,
            ra.created_at
        FROM registration_audit_log ra
        JOIN registration r ON r.registration_id = ra.registration_id
        JOIN competition c ON c.competition_id = r.competition_id
        JOIN user_account u ON u.user_id = ra.actor_user_id

        ORDER BY created_at DESC
        LIMIT 200
    `);

    res.json(result.rows);
};
