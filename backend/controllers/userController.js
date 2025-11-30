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
