import { pool } from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ---------------- REGISTER ----------------
export const registerUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password, date_birth } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Check existence
        const existingUser = await pool.query(
            `SELECT user_id FROM user_account WHERE email = $1`,
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await pool.query(
            `INSERT INTO user_account (first_name, last_name, email, password, date_birth)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, email, first_name, last_name, date_birth`,
            [first_name, last_name, email, hashedPassword, date_birth]
        );

        const user = result.rows[0];
        const role = await pool.query(
            `SELECT role_id FROM role WHERE name = 'user'`
        );

        if (role.rowCount === 0) {
            console.error("Role 'user' does not exist!");
        } else {
            await pool.query(
                `INSERT INTO role_user (user_id, role_id) VALUES ($1, $2)`,
                [user.user_id, role.rows[0].role_id]
            );
        }

        res.status(201).json({
            message: "User registered successfully.",
            user
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// ---------------- LOGIN ----------------
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            `SELECT user_id, email, password, first_name, last_name FROM user_account WHERE email = $1`,
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Compare password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Generate token
        const token = jwt.sign(
            { user_id: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful.",
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// ---------------- PROFILE (protected) ----------------
export const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, email, first_name, last_name, date_birth FROM user_account WHERE user_id = $1`,
            [req.user.user_id]
        );

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Profile error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

export const assignRole = async (req, res) => {
    try {
        const { id } = req.params;      // user_id
        const { role } = req.body;      // name role

        // zjisti role_id
        const roleResult = await pool.query(
            `SELECT role_id FROM role WHERE name = $1`,
            [role]
        );

        if (roleResult.rowCount === 0) {
            return res.status(400).json({ error: "Role not found" });
        }

        const roleId = roleResult.rows[0].role_id;

        // vlož do role_user
        await pool.query(
            `INSERT INTO role_user (user_id, role_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [id, roleId]
        );

        res.json({ message: `Role '${role}' assigned to user ${id}` });

    } catch (err) {
        console.error("assignRole error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const getUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, email, first_name, last_name, created_at FROM user_account`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load users" });
    }
};

export const getUser = async (req, res) => {
    try {
        const id = req.params.id;

        const result = await pool.query(
            `SELECT user_id, email, first_name, last_name, created_at 
       FROM user_account WHERE user_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load user" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;

        await pool.query(`DELETE FROM user_account WHERE user_id = $1`, [id]);

        res.json({ message: "User deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete user" });
    }
};

