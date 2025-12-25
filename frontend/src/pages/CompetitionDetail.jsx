import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCompetition, getCompetitionDisciplines } from "../api/competitionApi";
import { AuthContext } from "../context/AuthContext";
import { formatDate } from "../utils/date";
import "../styles/competitionDetail.css";

export default function CompetitionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [competition, setCompetition] = useState(null);
    const [disciplines, setDisciplines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDisciplines, setLoadingDisciplines] = useState(true);

    // 🔹 Načtení soutěže
    useEffect(() => {
        getCompetition(id)
            .then(data => {
                setCompetition(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch competition error:", err);
                setLoading(false);
            });
    }, [id]);

    // 🔹 Načtení disciplín
    useEffect(() => {
        getCompetitionDisciplines(id)
            .then(data => {
                setDisciplines(data || []);
                setLoadingDisciplines(false);
            })
            .catch(err => {
                console.error("Fetch disciplines error:", err);
                setLoadingDisciplines(false);
            });
    }, [id]);

    if (loading) return <p style={{ textAlign: "center" }}>Načítám soutěž...</p>;
    if (!competition) return <p style={{ textAlign: "center" }}>Soutěž nenalezena.</p>;

    return (
        <div className="detail-container">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Zpět
            </button>

            <div className="detail-card">
                <h1>{competition.name}</h1>

                <p className="description">{competition.description}</p>

                <div className="detail-grid">
                    <div className="detail-item">
                        <strong>Datum konání:</strong>
                        <span>{formatDate(competition.start_date)} — {formatDate(competition.end_date)}</span>
                    </div>

                    <div className="detail-item">
                        <strong>Registrace:</strong>
                        <span>{formatDate(competition.reg_start)} — {formatDate(competition.reg_end)}</span>
                    </div>

                    <div className="detail-item">
                        <strong>Lokace:</strong>
                        <span>{competition.location || "Neuvedeno"}</span>
                    </div>
                    <div className="detail-item">
                        <strong>Rozhodčí:</strong>
                        <span>
                            {competition.referee_first_name
                                ? `${competition.referee_first_name} ${competition.referee_last_name} (${competition.referee_category})`
                                : "Neuveden"}
                        </span>
                    </div>

                    <div className="detail-item">
                        <strong>Organizátor:</strong>
                        <span>
                            {(competition.owner_first_name && competition.owner_last_name)
                                ? `${competition.owner_first_name} ${competition.owner_last_name}`
                                : "Neuvedeno"}
                        </span>
                    </div>
                </div>

                {/* 🔹 Seznam disciplín */}
                <h2 style={{marginTop: "30px"}}>Disciplíny</h2>

                {loadingDisciplines ? (
                    <p>Načítám disciplíny...</p>
                ) : disciplines.length === 0 ? (
                    <p>Tato soutěž zatím nemá žádné disciplíny.</p>
                ) : (
                    <ul className="discipline-list">
                        {disciplines.map(d => (
                            <li className="discipline-item" key={d.discipline_id}>
                                <strong>{d.name}</strong>{" "}
                                {d.is_team ? "(týmová)" : "(individuální)"} — typ: {d.type}
                                <br/>
                                <span className="age-cats">
                                        Věková kategorie: {d.age_categories?.join(", ") || "neuvedeno"}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* 🔹 Tlačítko pro registraci */}
                <div className="competition-actions">
                    {!user ? (
                        <button
                            className="nav-btn"
                            onClick={() => navigate("/login")}
                        >
                            Přihlásit se pro registraci
                        </button>
                    ) : (
                        <button
                            className="hero-button"
                            onClick={() => navigate(`/registrations/start?competition=${competition.competition_id}`)}

                        >
                            Přihlásit se do soutěže
                        </button>
                    )}
                </div>

                <button onClick={() => navigate(`/competitions/${id}/edit`)}>
                    ⚙ Správa Souteží
                </button>
            </div>
        </div>
    );
}
