import React from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { useContext } from "react";

export default function CompetitionCard({ comp }) {
    const { user } = useContext(AuthContext);

    return (
        <div className="competition-card">
            <h3>{comp.name}</h3>
            <p>Lokace: {comp.location || "neuvedeno"}</p>
            <p>Datum: {comp.start_date} – {comp.end_date}</p>

            {!user && (
                <Link to="/login" className="btn-small">Přihlásit se</Link>
            )}

            {user && (
                <Link to={`/competitions/${comp.competition_id}`} className="btn-small">
                    Detail soutěže
                </Link>
            )}
        </div>
    );
}
