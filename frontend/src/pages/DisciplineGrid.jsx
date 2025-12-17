import React, { useEffect, useMemo, useState } from "react";
import api from "../api/apiClient";
import GridCell from "./GridCell";
import "../styles/disciplineGrid.css";

export default function DisciplineGrid({
                                           registrationId,
                                           competitionId,
                                           teams,
                                           readOnly = false
                                       }) {
    const athletes = teams.flatMap(t => t.athletes || []);

    const [disciplines, setDisciplines] = useState([]);
    const [entries, setEntries] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadDisciplines();
        loadEntries();
    }, [registrationId, competitionId]);

    async function loadDisciplines() {
        const res = await api.get(
            `/competitions/${competitionId}/disciplines`
        );
        setDisciplines(res.data);
    }

    async function deleteEntry(entryId) {
        await api.delete(`/entries/${entryId}`);
        setEntries(prev => prev.filter(e => e.entry_id !== entryId));
    }

    async function loadEntries() {
        const res = await api.get(
            `/entries/by-registration/${registrationId}`
        );
        setEntries(res.data);
    }

    const entryMap = useMemo(() => {
        const map = {};
        entries.forEach(e => {
            map[`${e.athlete_id}_${e.discipline_id}`] = e;
        });
        return map;
    }, [entries]);

    function findFreeTeamGroup(entries, discipline) {
        const limit = discipline.pocet_athletes;

        // spočítáme obsazenost mini-týmů
        const counts = {};
        entries.forEach(e => {
            if (e.team_group != null) {
                counts[e.team_group] = (counts[e.team_group] || 0) + 1;
            }
        });

        // najdeme první mini-tým, který není plný
        let group = 1;
        while ((counts[group] || 0) >= limit) {
            group++;
        }

        return group;
    }

    async function saveEntry({athlete_id, discipline_id}) {
        try {
            const res = await api.post("/entries/auto-assign", {
                registration_id: registrationId,
                athlete_id,
                discipline_id
            });

            setEntries(prev => [...prev, res.data]);
        } catch (err) {
            const code = err.response?.data?.code;

            if (code === "TEAM_FULL") {
                alert("Tým je již plný");
            } else if (code === "AGE_MISMATCH") {
                alert("Závodník nesplňuje věkovou kategorii");
            } else {
                alert("Nelze uložit změnu");
            }
            throw err;
        }
    }


    if (athletes.length === 0 || disciplines.length === 0) {
        return null;
    }

    return (
        <div className="discipline-grid-wrapper">
            <h2>Disciplíny</h2>

            <table className="discipline-grid">
                <thead>
                <tr>
                    <th>Závodník</th>
                    {disciplines.map(d => (
                        <th key={d.discipline_id}>{d.name}</th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {athletes.map(a => (
                    <tr key={a.athlete_id}>
                        <td>{a.first_name} {a.last_name}</td>

                        {disciplines.map(d => (
                            <GridCell
                                key={d.discipline_id}
                                athlete={a}
                                discipline={d}
                                entry={entryMap[`${a.athlete_id}_${d.discipline_id}`]}
                                onAdd={saveEntry}
                                onRemove={deleteEntry}
                                readOnly={readOnly}
                            />
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>

            {saving && <p className="saving">Ukládám…</p>}
        </div>
    );
}
