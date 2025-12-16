import React, { useState } from "react";

export default function GridCell({
                                     athlete,
                                     discipline,
                                     entry,
                                     registrationId,
                                     onChange,
                                     readOnly = false
                                 }) {
    const [error, setError] = useState(null);

    async function handleClick() {
        if (readOnly) return;

        let payload = {
            registration_id: registrationId,
            athlete_id: athlete.athlete_id,
            discipline_id: discipline.discipline_id
        };

        if (!discipline.is_team) {
            payload.is_selected = !entry;
            payload.team_group = null;
        } else {
            const next = !entry ? 1 : entry.team_group + 1;

            // TODO: nahradit dynamickým limitem podle disciplíny
            payload.team_group = next > 3 ? null : next;
            payload.is_selected = payload.team_group !== null;
        }

        try {
            await onChange(payload);
            setError(null);
        } catch (err) {
            const code = err?.response?.data?.code;
            setError(code || "ERROR");

            // auto-clear error po chvíli
            setTimeout(() => setError(null), 2000);
        }
    }

    let display = "";
    if (entry) {
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
