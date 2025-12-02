// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { pool } from "../db/index.js";

export const verifyToken = async (req, res, next) => {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: missing token" });
        }

        const token = header.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user_id;

        const userResult = await pool.query(
            `SELECT user_id, email FROM user_account WHERE user_id = $1`,
            [userId]
        );

        if (userResult.rowCount === 0) {
            return res.status(401).json({ error: "Unauthorized: user not found" });
        }

        const rolesResult = await pool.query(
            `SELECT r.name
             FROM role_user ru
                      JOIN role r ON ru.role_id = r.role_id
             WHERE ru.user_id = $1`,
            [userId]
        );

        req.user = {
            id: userId,
            email: userResult.rows[0].email,
            roles: rolesResult.rows.map(r => r.name)
        };

        next();
    } catch (err) {
        console.error("verifyToken error:", err);
        return res.status(401).json({ error: "Unauthorized: invalid token" });
    }
};