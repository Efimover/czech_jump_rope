import React, { useState } from "react";

export default function GridCell({
                                     athlete,
                                     discipline,
                                     entry,
                                     registrationId,
                                     onChange,
                                     onDelete,
                                     readOnly = false
                                 }) {
    const [error, setError] = useState(null);

    async function handleClick() {
        if (readOnly) return;

        try {
            // ===============================
            // INDIVIDUÁLNÍ DISCIPLÍNA
            // ===============================
            if (!discipline.is_team) {
                if (entry) {
                    // smažeme entry
                    await onDelete(entry.entry_id);
                } else {
                    await onChange({
                        registration_id: registrationId,
                        athlete_id: athlete.athlete_id,
                        discipline_id: discipline.discipline_id,
                        is_selected: true,
                        team_group: null
                    });
                }
                setError(null);
                return;
            }

            // ===============================
            // TÝMOVÁ DISCIPLÍNA
            // ===============================
            const max = discipline.pocet_athletes || 1;
            const next = !entry ? 1 : entry.team_group + 1;

            const team_group = next > max ? null : next;

            await onChange({
                registration_id: registrationId,
                athlete_id: athlete.athlete_id,
                discipline_id: discipline.discipline_id,
                team_group,
                is_selected: team_group !== null
            });

            setError(null);

        } catch (err) {
            const code = err?.response?.data?.code;
            setError(code || "ERROR");
            setTimeout(() => setError(null), 2000);
        }
    }

    // ===============================
    // CO ZOBRAZIT V BUŇCE
    // ===============================
    let display = "";
    if (entry && entry.is_selected) {
        display = discipline.is_team ? entry.team_group : "X";
    }

    return (
        <td
            className={`grid-cell ${error ? "error" : ""}`}
            onClick={handleClick}
            title={
                error === "TEAM_FULL"
                    ? "Tým je již plný"
                    : error === "AGE_MISMATCH"
                        ? "Nesplňuje věkovou kategorii"
                        : ""
            }
        >
            {display}
        </td>
    );
}
