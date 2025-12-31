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

const clients = new Map(); // userId -> response

export const notificationStream = (req, res) => {
    const userId = req.user.user_id;

    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
    });

    res.flushHeaders();

    clients.set(userId, res);

    // keep-alive ping
    const ping = setInterval(() => {
        res.write("event: ping\ndata: {}\n\n");
    }, 25000);

    req.on("close", () => {
        clearInterval(ping);
        clients.delete(userId);
    });
};

// helper – pošle notifikaci uživateli
export const pushNotification = (userId, payload) => {
    const client = clients.get(userId);
    if (!client) return;

    client.write(
        `event: notification\ndata: ${JSON.stringify(payload)}\n\n`
    );
};
