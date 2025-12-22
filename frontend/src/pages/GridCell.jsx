import React, { useState } from "react";

export default function GridCell({
                                     athlete,
                                     discipline,
                                     entry,
                                     onAdd,
                                     onRemove,
                                     readOnly = false
                                 }) {
    const [error, setError] = useState(null);


    async function handleClick() {
        if (readOnly) return;

        if (entry) {
            await onRemove(entry.entry_id);
        } else {
            await onAdd({
                athlete_id: athlete.athlete_id,
                competition_discipline_id: discipline.competition_discipline_id
            });
        }
    }

    return (
        <td
            className="grid-cell"
            onClick={handleClick}
        >
            {entry ? (discipline.is_team ? entry.team_group : "X") : ""}
        </td>
    );

}
