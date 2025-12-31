import { pool } from "../db/index.js";

import { logRegistrationAction } from "../services/auditService.js";

export const getRegistration = async (req, res) => {
    try {
        const { registration_id } = req.params;
        const userId = req.user.user_id;
        const role = req.user.active_role;

        let query = `
            SELECT
                r.registration_id,
                r.user_id,
                r.status,
                r.contact_name,
                r.contact_email,
                r.created_at,
                r.updated_at,
                c.name AS competition_name,
                c.competition_id
            FROM registration r
                     JOIN competition c ON c.competition_id = r.competition_id
            WHERE r.registration_id = $1
        `;

        const params = [registration_id];

        // soutěžící → jen svoje
        if (role === "soutezici" || role === "user") {
            query += " AND r.user_id = $2";
            params.push(userId);
        }

        // organizátor → jen soutěže, které vlastní
        if (role === "organizator") {
            query += " AND c.owner_id = $2";
            params.push(userId);
        }

        // admin → žádné omezení

        const reg = await pool.query(query, params);

        if (reg.rowCount === 0) {
            return res.status(404).json({
                error: "Registration not found"
            });
        }

        res.json(reg.rows[0]);

    } catch (err) {
        console.error("getRegistration error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const createRegistration = async (req, res) => {
    try {
        const { competition_id, contact_name, contact_email } = req.body;
        const userId = req.user.user_id;
        const role = req.user.active_role;

        // 1️⃣ Už existuje přihláška?
        const existing = await pool.query(
            `SELECT registration_id
             FROM registration
             WHERE competition_id = $1 AND user_id = $2`,
            [competition_id, userId]
        );

        if (existing.rowCount > 0) {
            return res.status(409).json({
                status: "error",
                message: "Přihláška již existuje pro tuto soutěž.",
                registration_id: existing.rows[0].registration_id
            });
        }

        // 2️⃣ Kontrola existence soutěže
        const comp = await pool.query(
            `
                SELECT competition_id
                FROM competition
                WHERE competition_id = $1
                  AND CURRENT_DATE BETWEEN reg_start AND reg_end
            `,
            [competition_id]
        );

        if (comp.rowCount === 0) {
            return res.status(400).json({
                code: "REGISTRATION_CLOSED",
                error: "Registrace do soutěže není otevřená"
            });
        }

        if (comp.rowCount === 0) {
            return res.status(404).json({
                status: "error",
                message: "Soutěž nebyla nalezena."
            });
        }

        const { reg_start, reg_end } = comp.rows[0];


        // 4️⃣ Vytvoření přihlášky
        const result = await pool.query(
            `INSERT INTO registration (competition_id, user_id, contact_name, contact_email)
             VALUES ($1, $2, $3, $4)
             RETURNING registration_id, status, created_at`,
            [competition_id, userId, contact_name, contact_email]
        );
        await logRegistrationAction({
            registration_id: result.rows[0].registration_id,
            actor_user_id: userId,
            actor_role: role,
            action: "CREATE",
            new_status: "saved",
            message: "Přihláška byla vytvořena"
        });

        return res.status(201).json({
            status: "success",
            message: "Přihláška vytvořena.",
            registration: result.rows[0]
        });



    } catch (err) {
        console.error("Create registration error:", err);
        return res.status(500).json({
            status: "error",
            message: "Došlo k chybě serveru. Zkuste to prosím znovu."
        });
    }

};

export const submitRegistration = async (req, res) => {
    const { registration_id } = req.params;
    const userId = req.user.user_id;
    const role = req.user.active_role;

    try {
        // 1️⃣ ověř vlastnictví a stav
        const regRes = await pool.query(
            `
            SELECT status
            FROM registration
            WHERE registration_id = $1
              AND user_id = $2
            `,
            [registration_id, userId]
        );

        if (regRes.rowCount === 0) {
            return res.status(403).json({
                error: "Nepovolený přístup"
            });
        }

        if (regRes.rows[0].status === "submitted") {
            return res.status(400).json({
                error: "Přihláška je již odeslaná"
            });
        }

        // 2️⃣ musí existovat alespoň 1 tým
        const teamRes = await pool.query(
            `
            SELECT COUNT(*)::int AS count
            FROM team
            WHERE registration_id = $1
            `,
            [registration_id]
        );

        if (teamRes.rows[0].count === 0) {
            return res.status(400).json({
                error: "Přihláška musí obsahovat alespoň jeden tým"
            });
        }

        // 3️⃣ každý atlet musí mít alespoň jednu disciplínu
        const invalidAthletes = await pool.query(
            `
            SELECT a.athlete_id
            FROM athlete a
            JOIN team_athlete ta ON ta.athlete_id = a.athlete_id
            JOIN team t ON t.team_id = ta.team_id
            WHERE t.registration_id = $1
              AND NOT EXISTS (
                  SELECT 1
                  FROM entry e
                  WHERE e.athlete_id = a.athlete_id
              )
            `,
            [registration_id]
        );

        if (invalidAthletes.rowCount > 0) {
            return res.status(400).json({
                error: "Každý závodník musí mít alespoň jednu disciplínu"
            });
        }
        const invalidTeams = await pool.query(
            `
    SELECT
        e.discipline_id,
        d.name,
        e.team_group,
        COUNT(*) AS count,
        d.pocet_athletes
    FROM entry e
    JOIN discipline d ON d.discipline_id = e.discipline_id
    WHERE e.registration_id = $1
      AND d.is_team = true
      AND e.team_group IS NOT NULL
    GROUP BY e.discipline_id, d.name, e.team_group, d.pocet_athletes
    HAVING COUNT(*) < d.pocet_athletes
    `,
            [registration_id]
        );

        if (invalidTeams.rowCount > 0) {
            return res.status(400).json({
                code: "INCOMPLETE_TEAMS",
                error: "Některé týmové disciplíny nemají plný počet závodníků",
                details: invalidTeams.rows
            });
        }

        // → změna stavu
        await pool.query(
            `
                UPDATE registration
                SET status = 'submitted'
                WHERE registration_id = $1
                  AND user_id = $2
                  AND status = 'saved'
            `,
            [registration_id, userId]
        );

        res.json({ success: true });

        //  NOTIFICATION – vlastníkovi soutěže
        const notifRes = await pool.query(
            `
            SELECT c.owner_id, c.name, r.competition_id
            FROM registration r
            JOIN competition c ON c.competition_id = r.competition_id
            WHERE r.registration_id = $1
            `,
            [registration_id]
        );

        if (notifRes.rowCount > 0) {
            const { owner_id, name, competition_id } = notifRes.rows[0];

            await pool.query(
                `
                INSERT INTO notification (user_id, type, title, message, link)
                VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    owner_id,
                    "REGISTRATION_SUBMITTED",
                    "Nová přihláška",
                    `Byla odeslána nová přihláška do soutěže „${name}“.`,
                    `/competitions/${competition_id}`
                ]
            );
        }

        await logRegistrationAction({
            registration_id,
            actor_user_id: userId,
            actor_role: role,
            action: "SUBMIT",
            old_status: "saved",
            new_status: "submitted",
            message: "Přihláška byla odeslána soutěžícím"
        });

    } catch (err) {
        console.error("submitRegistration error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Smazani prihlasek

export const deleteRegistration = async (req, res) => {
    const { registration_id } = req.params;
    const userId = req.user.user_id;
    const role = req.user.active_role;
    await logRegistrationAction({
        registration_id,
        actor_user_id: userId,
        actor_role: role,
        action: "DELETE",
        message: "Přihláška byla trvale smazána"
    });

    let query = `
        DELETE FROM registration r
        USING competition c
        WHERE r.registration_id = $1
          AND c.competition_id = r.competition_id
    `;

    const params = [registration_id];

    if (role === "soutezici" || role === "user") {
        query += " AND r.user_id = $2 AND r.status = 'saved'";
        params.push(userId);
    }

    if (role === "organizator") {
        query += " AND c.owner_id = $2";
        params.push(userId);
    }

    // admin → bez omezení

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
        return res.status(403).json({
            error: "Přihlášku nelze smazat"
        });
    }

    res.json({ success: true });
};


export const getMyRegistrations = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            `
                SELECT
                    r.registration_id,
                    r.status,
                    r.created_at,
                    r.updated_at,
                    c.name AS competition_name,

                    COALESCE(
                                    ARRAY_AGG(DISTINCT d.name)
                                    FILTER (WHERE d.name IS NOT NULL),
                                    '{}'
                    ) AS disciplines

                FROM registration r
                         JOIN competition c
                              ON c.competition_id = r.competition_id

                         LEFT JOIN team t
                                   ON t.registration_id = r.registration_id
                         LEFT JOIN team_athlete ta
                                   ON ta.team_id = t.team_id
                         LEFT JOIN entry e
                                   ON e.athlete_id = ta.athlete_id
                                       AND e.registration_id = r.registration_id
                         LEFT JOIN discipline d
                                   ON d.discipline_id = e.discipline_id

                WHERE r.user_id = $1
                GROUP BY r.registration_id, c.name
                ORDER BY r.created_at DESC
            `,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("getMyRegistrations error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const reopenRegistration = async (req, res) => {
    const { registration_id } = req.params;
    const userId = req.user.user_id;
    const role = req.user.active_role;

    let query = `
        UPDATE registration r
        SET status = 'saved'
        FROM competition c
        WHERE r.registration_id = $1
          AND r.status = 'submitted'
          AND c.competition_id = r.competition_id
    `;

    const params = [registration_id];

    if (role === "organizator") {
        query += " AND c.owner_id = $2";
        params.push(userId);
    }

    // admin → bez omezení

    const result = await pool.query(query, params);

    await logRegistrationAction({
        registration_id,
        actor_user_id: userId,
        actor_role: role,
        action: "REOPEN",
        old_status: "submitted",
        new_status: "saved",
        message: "Admin/organizátor vrátil přihlášku k úpravám"
    });

    if (result.rowCount === 0) {
        return res.status(403).json({
            error: "Nelze změnit stav přihlášky"
        });
    }


    res.json({ success: true });
};



//Admin + oragnizator view registrations

export const getRegistrationsByRole = async (req, res) => {
    const userId = req.user.user_id;
    const role = req.user.active_role;

    let query;
    let params = [];

    if (role === "admin") {
        query = `
            SELECT
                r.registration_id,
                r.status,
                r.created_at,
                u.email AS user_email,
                c.name AS competition_name
            FROM registration r
            JOIN competition c ON c.competition_id = r.competition_id
            JOIN user_account u ON u.user_id = r.user_id
            ORDER BY r.created_at DESC
        `;
    }

    else if (role === "organizator") {
        query = `
            SELECT
                r.registration_id,
                r.status,
                r.created_at,
                u.email AS user_email,
                c.name AS competition_name
            FROM registration r
            JOIN competition c ON c.competition_id = r.competition_id
            JOIN user_account u ON u.user_id = r.user_id
            WHERE c.owner_id = $1
            ORDER BY r.created_at DESC
        `;
        params = [userId];
    }

    else {
        return res.status(403).json({
            error: "Nepovolený přístup"
        });
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
};