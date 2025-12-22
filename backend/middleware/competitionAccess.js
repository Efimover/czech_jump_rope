import { pool } from "../db/index.js";

export const requireCompetitionOwnerOrAdmin = async (req, res, next) => {
    try {
        const user = req.user;
        const competitionId =
            req.params.competition_id ||
            req.params.id ||
            req.body.competition_id;

        if (!competitionId) {
            return res.status(400).json({
                error: "Missing competition id"
            });
        }

        //  admin může vše
        if (user.roles.includes("admin")) {
            return next();
        }

        // organizátor  musí být vlastník
        if (user.roles.includes("organizator")) {
            const result = await pool.query(
                `
                SELECT 1
                FROM competition
                WHERE competition_id = $1
                  AND owner_id = $2
                `,
                [competitionId, user.user_id]
            );

            if (result.rowCount === 0) {
                return res.status(403).json({
                    error: "Nemáte oprávnění upravovat tuto soutěž"
                });
            }

            return next();
        }

        //  ostatní role
        return res.status(403).json({
            error: "Nedostatečná oprávnění"
        });

    } catch (err) {
        console.error("competition access error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const requireCompetitionOwnerOrAdminByCD = async (req, res, next) => {
    try {
        const { competitionDisciplineId } = req.params;
        const user = req.user;

        // admin
        if (user.roles.includes("admin")) {
            return next();
        }

        const cdRes = await pool.query(
            `
            SELECT c.owner_id
            FROM competition_discipline cd
            JOIN competition c ON c.competition_id = cd.competition_id
            WHERE cd.id = $1
            `,
            [competitionDisciplineId]
        );

        if (cdRes.rowCount === 0) {
            return res.status(404).json({ error: "Competition discipline not found" });
        }

        const ownerId = cdRes.rows[0].owner_id;

        if (
            user.roles.includes("organizator") &&
            ownerId === user.user_id
        ) {
            return next();
        }

        return res.status(403).json({
            error: "Nemáte oprávnění upravovat tuto soutěž"
        });

    } catch (err) {
        console.error("competition access error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
