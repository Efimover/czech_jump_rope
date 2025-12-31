import { pool } from "../db/index.js";

export const getMyNotifications = async (req, res) => {
    const userId = req.user.user_id;

    const result = await pool.query(
        `
        SELECT *
        FROM notification
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId]
    );

    res.json(result.rows);
};

export const markAsRead = async (req, res) => {
    const userId = req.user.user_id;
    const { id } = req.params;

    await pool.query(
        `
        UPDATE notification
        SET is_read = true
        WHERE notification_id = $1
          AND user_id = $2
        `,
        [id, userId]
    );

    res.json({ success: true });
};
