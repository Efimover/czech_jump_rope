import jwt from "jsonwebtoken";
import { pool } from "../../db/index.js";

export async function createUser({
                                     email,
                                     password = "test123",
                                     role = "user",
                                     active_role = "user"
                                 }) {
    const userRes = await pool.query(
        `
    INSERT INTO user_account (email, password, active_role)
    VALUES ($1, $2, $3)
    RETURNING user_id
    `,
        [email, password, active_role]
    );

    const userId = userRes.rows[0].user_id;

    const roleRes = await pool.query(
        `SELECT role_id FROM role WHERE name = $1`,
        [role]
    );

    await pool.query(
        `INSERT INTO role_user (user_id, role_id) VALUES ($1, $2)`,
        [userId, roleRes.rows[0].role_id]
    );

    return userId;
}

export function authCookie(user_id) {
    const token = jwt.sign({ user_id }, process.env.JWT_SECRET);
    return [`access_token=${token}`];
}