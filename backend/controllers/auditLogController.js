import { pool } from "../db/index.js";

export const getRegistrationAuditLog = async (req, res) => {
    const { registration_id } = req.params;
    const role = req.user.active_role;
    const userId = req.user.user_id;

    let query = `
        SELECT
            l.*,
            u.email AS actor_email
        FROM registration_audit_log l
        JOIN user_account u ON u.user_id = l.actor_user_id
        LEFT JOIN registration r ON r.registration_id = l.registration_id
        JOIN competition c ON c.competition_id = r.competition_id
        WHERE l.registration_id = $1
    `;

    const params = [registration_id];

    if (role === "soutezici" || role === "user") {
        query += " AND r.user_id = $2";
        params.push(userId);
    }

    if (role === "organizator") {
        query += " AND c.owner_id = $2";
        params.push(userId);
    }

    query += " ORDER BY l.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
};