// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { pool } from "../db/index.js";

export const verifyToken = async (req, res, next) => {
    try {
        let token = req.cookies?.access_token;

        // fallback pro REST (pokud bys chtěla zachovat header)
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ error: "Missing token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userRes = await pool.query(
            `
            SELECT user_id, email, active_role
            FROM user_account
            WHERE user_id = $1
            `,
            [decoded.user_id]
        );

        if (userRes.rowCount === 0) {
            return res.status(401).json({ error: "User not found" });
        }

        const rolesRes = await pool.query(
            `
            SELECT r.name
            FROM role_user ru
            JOIN role r ON r.role_id = ru.role_id
            WHERE ru.user_id = $1
            `,
            [decoded.user_id]
        );

        req.user = {
            user_id: decoded.user_id,
            email: userRes.rows[0].email,
            roles: rolesRes.rows.map(r => r.name),
            active_role: userRes.rows[0].active_role
        };

        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};