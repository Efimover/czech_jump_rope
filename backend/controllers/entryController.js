import { pool } from "../db/index.js";

export const getEntriesByRegistration = async (req, res) => {
    const { registration_id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `
                SELECT e.*
                FROM entry e
                         JOIN registration r ON r.registration_id = e.registration_id
                WHERE e.registration_id = $1
                  AND r.user_id = $2
            `,
            [registration_id, userId]
        );


        res.json(result.rows);
    } catch (err) {
        console.error("getEntriesByRegistration error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
export const upsertEntry = async (req, res) => {
    const {
        registration_id,
        athlete_id,
        discipline_id,
        is_selected,
        team_group
    } = req.body;

    const userId = req.user.id;

    try {
        // 1️⃣ ověř registraci
        const reg = await pool.query(
            `
      SELECT status
      FROM registration
      WHERE registration_id = $1 AND user_id = $2
      `,
            [registration_id, userId]
        );

        if (reg.rowCount === 0) {
            return res.status(403).json({ error: "Nepovolený přístup" });
        }

        if (reg.rows[0].status === "submitted") {
            return res.status(403).json({
                error: "Odeslanou přihlášku nelze upravovat"
            });
        }

        // 2️⃣ načíst disciplínu
        const disciplineRes = await pool.query(
            `
      SELECT is_team, pocet_athletes
      FROM discipline
      WHERE discipline_id = $1
      `,
            [discipline_id]
        );

        if (disciplineRes.rowCount === 0) {
            return res.status(404).json({ error: "Disciplína neexistuje" });
        }

        const { is_team, pocet_athletes } = disciplineRes.rows[0];

        // 3️⃣ validace
        if (!is_team && team_group !== null) {
            return res.status(400).json({
                error: "Individuální disciplína nesmí mít tým"
            });
        }

        if (is_team && !team_group) {
            return res.status(400).json({
                error: "Týmová disciplína vyžaduje číslo týmu"
            });
        }
        // kontrola počtu členů týmu
        if (is_team && team_group !== null) {
            const countRes = await pool.query(
                `
    SELECT COUNT(*)::int AS count
    FROM entry
    WHERE registration_id = $1
      AND discipline_id = $2
      AND team_group = $3
      AND athlete_id != $4
    `,
                [registration_id, discipline_id, team_group, athlete_id]
            );

            if (countRes.rows[0].count >= pocet_athletes) {
                return res.status(400).json({
                    code: "TEAM_FULL",
                    error: `Tým je již plný (max ${pocet_athletes})`
                });
            }
        }

        const athleteRes = await pool.query(
            `
                SELECT birth_year
                FROM athlete
                WHERE athlete_id = $1
            `,
            [athlete_id]
        );
        if (athleteRes.rowCount === 0) {
            return res.status(404).json({
                error: "Závodník neexistuje"
            });
        }

        const birthYear = athleteRes.rows[0].birth_year;
        const compRes = await pool.query(
            `
                SELECT EXTRACT(YEAR FROM start_date)::int AS year
                FROM competition
                         JOIN registration r ON r.competition_id = competition.competition_id
                WHERE r.registration_id = $1
            `,
            [registration_id]
        );

        const competitionYear = compRes.rows[0].year;
        const age = competitionYear - birthYear;
        const catRes = await pool.query(
            `
  SELECT ac.min_age, ac.max_age
  FROM discipline_age_category dac
  JOIN age_category ac ON ac.age_category_id = dac.age_category_id
  WHERE dac.discipline_id = $1
  `,
            [discipline_id]
        );
        let valid = true;

        if (catRes.rows.length > 0) {
            valid = catRes.rows.some(c =>
                age >= c.min_age &&
                (c.max_age === null || age <= c.max_age)
            );
        }

        if (!valid) {
            return res.status(400).json({
                code: "AGE_MISMATCH",
                error: "Závodník nesplňuje věkovou kategorii disciplíny"
            });
        }

        // 4️⃣ UPSERT
        const result = await pool.query(
            `
      INSERT INTO entry (
        registration_id,
        athlete_id,
        discipline_id,
        team_group,
        is_selected
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (athlete_id, discipline_id)
      DO UPDATE SET
        team_group = EXCLUDED.team_group,
        is_selected = EXCLUDED.is_selected
      RETURNING *
      `,
            [
                registration_id,
                athlete_id,
                discipline_id,
                team_group ?? null,
                is_selected ?? true
            ]
        );

        res.json(result.rows[0]);

    } catch (err) {
        console.error("upsertEntry error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const deleteEntry = async (req, res) => {
    const { entry_id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `
      DELETE FROM entry
      USING registration
      WHERE entry.entry_id = $1
        AND entry.registration_id = registration.registration_id
        AND registration.user_id = $2
        AND registration.status != 'submitted'
      RETURNING entry.entry_id
      `,
            [entry_id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Entry nenalezena nebo nelze smazat"
            });
        }

        res.json({ success: true });

    } catch (err) {
        console.error("deleteEntry error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const autoAssignEntry = async (req, res) => {
    const { registration_id, athlete_id, discipline_id } = req.body;
    const userId = req.user.id;

    try {
        // ověření registrace
        const reg = await pool.query(
            `SELECT status FROM registration WHERE registration_id=$1 AND user_id=$2`,
            [registration_id, userId]
        );
        if (reg.rowCount === 0 || reg.rows[0].status === "submitted") {
            return res.status(403).json({ error: "Nelze upravovat" });
        }

        const dRes = await pool.query(
            `SELECT is_team, pocet_athletes FROM discipline WHERE discipline_id=$1`,
            [discipline_id]
        );
        const discipline = dRes.rows[0];

        // INDIVIDUÁLNÍ
        if (!discipline.is_team) {
            const result = await pool.query(
                `
                INSERT INTO entry (registration_id, athlete_id, discipline_id)
                VALUES ($1,$2,$3)
                ON CONFLICT (athlete_id, discipline_id) DO NOTHING
                RETURNING *
                `,
                [registration_id, athlete_id, discipline_id]
            );
            return res.json(result.rows[0]);
        }

        // TÝMOVÁ – najdi volný mini-tým
        const entriesRes = await pool.query(
            `
            SELECT team_group, COUNT(*)::int AS count
            FROM entry
            WHERE registration_id=$1 AND discipline_id=$2
            GROUP BY team_group
            `,
            [registration_id, discipline_id]
        );

        const counts = {};
        entriesRes.rows.forEach(r => (counts[r.team_group] = r.count));

        let group = 1;
        while ((counts[group] || 0) >= discipline.pocet_athletes) {
            group++;
        }

        const result = await pool.query(
            `
            INSERT INTO entry (registration_id, athlete_id, discipline_id, team_group)
            VALUES ($1,$2,$3,$4)
            RETURNING *
            `,
            [registration_id, athlete_id, discipline_id, group]
        );

        res.json(result.rows[0]);

    } catch (err) {
        console.error("autoAssignEntry error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
