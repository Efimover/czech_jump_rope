import { pool } from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyGoogleToken } from "../services/googleAuthService.js";

// ---------------- REGISTER ----------------
export const registerUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password, date_birth } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Check existence
        const existingUser = await pool.query(
            `
                SELECT auth_provider
                FROM user_account
                WHERE email = $1
            `,
            [email]
        );

        if (existingUser.rowCount > 0) {
            const provider = existingUser.rows[0].auth_provider;

            if (provider === "google") {
                return res.status(400).json({
                    error: "Účet s tímto e-mailem již existuje a používá Google přihlášení",
                    provider: "google"
                });
            }

            return res.status(400).json({
                error: "Účet s tímto e-mailem již existuje"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const birthDate =
            date_birth && date_birth.trim() !== "" ? date_birth : null;


        // Insert user
        const result = await pool.query(
            `INSERT INTO user_account (first_name, last_name, email, password, date_birth, auth_provider, active_role)
             VALUES ($1, $2, $3, $4, $5, 'local', 'user')
             RETURNING user_id, email, first_name, last_name, date_birth`,
            [first_name, last_name, email, hashedPassword, birthDate]
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
            `
                SELECT user_id, email, password, first_name, last_name, active_role
                FROM user_account
                WHERE email = $1
            `,
            [email]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        if (!user.password) {
            return res.status(400).json({
                error: "Tento účet používá přihlášení přes Google",
                provider: "google"
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // načti role
        const rolesRes = await pool.query(
            `
                SELECT r.name
                FROM role_user ru
                         JOIN role r ON r.role_id = ru.role_id
                WHERE ru.user_id = $1
            `,
            [user.user_id]
        );

        const roles = rolesRes.rows.map(r => r.name);

        // nastav defaultní active_role, pokud není
        let activeRole = user.active_role;
        if (!activeRole || !roles.includes(activeRole)) {
            activeRole = roles[0]; // první role
            await pool.query(
                `UPDATE user_account SET active_role = $1 WHERE user_id = $2`,
                [activeRole, user.user_id]
            );
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                active_role: activeRole
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                roles,
                active_role: activeRole
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

//Login with Google

export const loginWithGoogle = async (req, res) => {
    const { idToken } = req.body;
    const payload = await verifyGoogleToken(idToken);

    const {
        sub: googleId,
        email,
        given_name,
        family_name
    } = payload;

    // 1️⃣ najdi uživatele podle emailu
    let userRes = await pool.query(
        `SELECT * FROM user_account WHERE email = $1`,
        [email]
    );

    let user;

    if (userRes.rowCount === 0) {
        // 2️⃣ neexistuje → vytvoř nový Google účet
        const insert = await pool.query(
            `
            INSERT INTO user_account (
                email,
                first_name,
                last_name,
                google_id,
                auth_provider,
                active_role
            )
            VALUES ($1,$2,$3,$4,'google','user')
            RETURNING *
            `,
            [email, given_name, family_name, googleId]
        );

        user = insert.rows[0];

        // role "user"
        const roleRes = await pool.query(
            `SELECT role_id FROM role WHERE name = 'user'`
        );

        await pool.query(
            `INSERT INTO role_user (user_id, role_id) VALUES ($1,$2)`,
            [user.user_id, roleRes.rows[0].role_id]
        );

    } else {
        // 3️⃣ existuje → PROPOJ
        user = userRes.rows[0];

        if (!user.google_id) {
            await pool.query(
                `
                UPDATE user_account
                SET google_id = $1,
                    auth_provider = CASE
                        WHEN auth_provider = 'local' THEN 'both'
                        ELSE auth_provider
                    END
                WHERE user_id = $2
                `,
                [googleId, user.user_id]
            );
        }
    }

    // 4️⃣ načti role
    const rolesRes = await pool.query(
        `
        SELECT r.name
        FROM role_user ru
        JOIN role r ON r.role_id = ru.role_id
        WHERE ru.user_id = $1
        `,
        [user.user_id]
    );

    const roles = rolesRes.rows.map(r => r.name);

    // 5️⃣ JWT
    const token = jwt.sign(
        {
            user_id: user.user_id,
            active_role: user.active_role
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({
        token,
        user: {
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            roles,
            active_role: user.active_role,
            auth_provider: user.auth_provider
        }
    });
};

export const getMe = async (req, res) => {
    const userId = req.user.user_id;

    const result = await pool.query(
        `
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.active_role,
                u.auth_provider,
                json_agg(r.name) AS roles
            FROM user_account u
                     JOIN role_user ru ON ru.user_id = u.user_id
                     JOIN role r ON r.role_id = ru.role_id
            WHERE u.user_id = $1
            GROUP BY u.user_id
        `,
        [userId]
    );

    res.json(result.rows[0]);
};

export const updateMe = async (req, res) => {
    const userId = req.user.user_id;
    const { first_name, last_name, date_birth } = req.body;

    const result = await pool.query(
        `
        UPDATE user_account
        SET
            first_name = $1,
            last_name = $2,
            date_birth = $3
        WHERE user_id = $4
        RETURNING
            user_id, first_name, last_name, email, date_birth
        `,
        [first_name, last_name, date_birth, userId]
    );

    res.json(result.rows[0]);
};

export const assignRole = async (req, res) => {
    try {
        const { user_id } = req.params;      // user_id
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
            [user_id, roleId]
        );

        res.json({ message: `Role '${role}' assigned to user ${user_id}` });

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


// Zmena hesla, zakazano uctu GOOGLE

export const changePassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: "Chybí aktuální nebo nové heslo"
            });
        }

        // načti uživatele + auth_provider
        const userRes = await pool.query(
            `
            SELECT password, auth_provider
            FROM user_account
            WHERE user_id = $1
            `,
            [userId]
        );

        if (userRes.rowCount === 0) {
            return res.status(404).json({ error: "Uživatel nenalezen" });
        }

        const { password, auth_provider } = userRes.rows[0];

        // ZÁKAZ pro Google účty
        if (auth_provider === "google") {
            return res.status(400).json({
                error: "Uživatel přihlášený přes Google nemůže měnit heslo"
            });
        }

        // ověř staré heslo
        const match = await bcrypt.compare(currentPassword, password);
        if (!match) {
            return res.status(400).json({
                error: "Aktuální heslo není správné"
            });
        }

        //  nové heslo
        const newHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `
                UPDATE user_account
                SET password = $1
                WHERE user_id = $2
            `,
            [newHash, userId]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("changePassword error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

//controller pro prepinani roli

export const switchActiveRole = async (req, res) => {
    const userId = req.user.user_id;
    const { role } = req.body;

    // ověř, že uživatel tuto roli má
    const check = await pool.query(
        `
        SELECT 1
        FROM role_user ru
        JOIN role r ON r.role_id = ru.role_id
        WHERE ru.user_id = $1 AND r.name = $2
        `,
        [userId, role]
    );

    if (check.rowCount === 0) {
        return res.status(400).json({
            error: "Uživatel tuto roli nemá"
        });
    }

    await pool.query(
        `
        UPDATE user_account
        SET active_role = $1
        WHERE user_id = $2
        `,
        [role, userId]
    );

    res.json({ active_role: role });
};


export const getAllUsersForAdmin = async (req, res) => {
    const result = await pool.query(`
        SELECT
            u.user_id,
            u.email,
            u.first_name,
            u.last_name,
            u.active_role,
            u.auth_provider,
            ARRAY_AGG(r.name) AS roles
        FROM user_account u
        LEFT JOIN role_user ru ON ru.user_id = u.user_id
        LEFT JOIN role r ON r.role_id = ru.role_id
        GROUP BY u.user_id
        ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
};


export const removeRole = async (req, res) => {
    const { user_id, role } = req.params;
    const actorId = req.user.user_id;

    // 1️Pokud se snažíš odebrat admin roli
    if (role === "admin") {
        // zjisti, zda cílový uživatel je admin
        const isAdmin = await pool.query(
            `
            SELECT 1
            FROM role_user ru
            JOIN role r ON r.role_id = ru.role_id
            WHERE ru.user_id = $1 AND r.name = 'admin'
            `,
            [user_id]
        );

        if (isAdmin.rowCount > 0) {
            return res.status(403).json({
                error: "Nelze odebrat roli admin administrátorovi"
            });
        }
    }

    const roleRes = await pool.query(
        `SELECT role_id FROM role WHERE name = $1`,
        [role]
    );

    if (roleRes.rowCount === 0) {
        return res.status(404).json({ error: "Role not found" });
    }

    // 2️Oddebrání role
    await pool.query(
        `
        DELETE FROM role_user
        WHERE user_id = $1 AND role_id = $2
        `,
        [user_id, roleRes.rows[0].role_id]
    );

    // 3Fallback active_role
    await pool.query(
        `
        UPDATE user_account
        SET active_role = (
            SELECT r.name
            FROM role_user ru
            JOIN role r ON r.role_id = ru.role_id
            WHERE ru.user_id = $1
            LIMIT 1
        )
        WHERE user_id = $1
        `,
        [user_id]
    );

    res.json({ success: true });
};


export const deleteUserCompletely = async (req, res) => {
    const { user_id } = req.params;
    const adminId = req.user.user_id;

    if (Number(user_id) === adminId) {
        return res.status(400).json({
            error: "Nemůžete smazat sami sebe"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1️ Zjistit role uživatele
        const rolesRes = await client.query(
            `
            SELECT r.name
            FROM role_user ru
            JOIN role r ON r.role_id = ru.role_id
            WHERE ru.user_id = $1
            `,
            [user_id]
        );

        const roles = rolesRes.rows.map(r => r.name);

        // 2 Ohrana poslední admin
        if (roles.includes("admin")) {
            const adminCount = await client.query(
                `
                SELECT COUNT(*)::int AS count
                FROM role_user ru
                JOIN role r ON r.role_id = ru.role_id
                WHERE r.name = 'admin'
                `
            );

            if (adminCount.rows[0].count <= 1) {
                return res.status(400).json({
                    error: "Nelze smazat posledního administrátora"
                });
            }
        }

        // 3️MAZANI ZÁVISLÝCH DAT

        // ENTRY
        await client.query(
            `
                DELETE FROM entry
                WHERE registration_id IN (
                    SELECT registration_id
                    FROM registration
                    WHERE user_id = $1
                )
            `,
            [user_id]
        );

// TEAM_ATHLETE
        await client.query(
            `
                DELETE FROM team_athlete
                WHERE team_id IN (
                    SELECT team_id
                    FROM team
                    WHERE registration_id IN (
                        SELECT registration_id
                        FROM registration
                        WHERE user_id = $1
                    )
                )
            `,
            [user_id]
        );

// TEAM
        await client.query(
            `
                DELETE FROM team
                WHERE registration_id IN (
                    SELECT registration_id
                    FROM registration
                    WHERE user_id = $1
                )
            `,
            [user_id]
        );

// REGISTRATION
        await client.query(
            `DELETE FROM registration WHERE user_id = $1`,
            [user_id]
        );

// ROLE_USER
        await client.query(
            `DELETE FROM role_user WHERE user_id = $1`,
            [user_id]
        );

// USER
        await client.query(
            `DELETE FROM user_account WHERE user_id = $1`,
            [user_id]
        );

        await client.query("COMMIT");

        res.json({
            success: true,
            message: "Uživatel byl trvale smazán"
        });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("deleteUserCompletely error:", err);
        res.status(500).json({ error: "Server error" });
    } finally {
        client.release();
    }
};
