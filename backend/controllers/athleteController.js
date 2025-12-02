import {
    validateRegistrationOwnership,
    validateRegistrationIsOpen,
    createAthlete,
    createEntriesForAthlete
} from "../services/athleteService.js";

export const createAthleteController = async (req, res) => {
    try {
        const {
            registration_id,
            first_name,
            last_name,
            birth_year,
            gender,
            disciplines
        } = req.body;

        const userId = req.user.id;

        // 1️⃣ Přihláška patří uživateli?
        const reg = await validateRegistrationOwnership(userId, registration_id);
        if (!reg) {
            return res.status(403).json({ error: "Forbidden — registration does not belong to you." });
        }

        const competition_id = reg.competition_id;

        // 2️⃣ Registrace je otevřená?
        const open = await validateRegistrationIsOpen(competition_id);
        if (!open) {
            return res.status(400).json({ error: "Registration period is closed." });
        }

        // 3️⃣ Vytvoř závodníka
        const athlete = await createAthlete({
            first_name,
            last_name,
            birth_year,
            gender
        });

        // 4️⃣ Přiřaď disciplíny
        if (Array.isArray(disciplines) && disciplines.length > 0) {
            await createEntriesForAthlete({
                registration_id,
                competition_id,
                athlete_id: athlete.athlete_id,
                birth_year,
                disciplines
            });
        }

        return res.status(201).json({
            message: "Athlete registered successfully",
            athlete
        });

    } catch (err) {
        console.error("createAthleteController error:", err);
        res.status(400).json({ error: err.message });
    }
};
