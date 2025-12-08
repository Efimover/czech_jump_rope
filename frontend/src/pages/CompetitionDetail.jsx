import React from "react";
import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { getCompetition } from "../api/competitionApi.js";

export default function CompetitionDetail() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [competition, setCompetition] = useState(null);

    useEffect(() => {
        getCompetition(id).then(setCompetition);
    }, [id]);

    if (!competition) return <p>Načítám...</p>;

    return (
        <div className="competition-detail">
            <h2>{competition.name}</h2>

            <p>Datum začátku: {competition.start_date}</p>
            <p>Datum konce: {competition.end_date}</p>
            <p>Registrace: {competition.reg_start} – {competition.reg_end}</p>

            <h3>Disciplíny</h3>
            <ul>
                {competition.disciplines?.map(d => (
                    <li key={d.discipline_id}>{d.name}</li>
                ))}
            </ul>

            {!user && (
                <Link to="/login" className="btn">
                    Přihlásit se pro registraci
                </Link>
            )}

            {user && (
                <Link
                    to={`/competitions/${id}/registration`}
                    className="btn-green"
                >
                    Přihlásit se
                </Link>
            )}
        </div>
    );
}
