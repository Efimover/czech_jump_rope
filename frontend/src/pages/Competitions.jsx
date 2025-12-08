import React from "react";
import { useEffect, useState } from "react";
import { getCompetitions } from "../api/competitionApi.js";
import CompetitionCard from "../components/CompetitionCard.jsx";

export default function ListOfCompetitions() {
    const [competitions, setCompetitions] = useState([]);

    useEffect(() => {
        getCompetitions().then(setCompetitions);
    }, []);

    return (
        <div className="competitions-page">
            <h1>Seznam soutěží</h1>

            <div className="competition-grid">
                {competitions.map(c => (
                    <CompetitionCard key={c.competition_id} comp={c} />
                ))}
            </div>
        </div>
    );
}
