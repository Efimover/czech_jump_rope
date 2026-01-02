import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCompetition, getCompetitionDisciplines } from "../api/competitionApi";
import { AuthContext } from "../context/AuthContext";
import { formatDate } from "../utils/date";
import "../styles/competitionDetail.css";
import api from "../api/apiClient.js";

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
                if (err.response?.data?.code === "COMPETITION_DELETED") {
                    alert("Tato soutěž byla odstraněna.");
                    navigate("/");
                    return;
                }

                console.error("Fetch competition error:", err);
                setLoading(false);
            });
    }, [id]);

    // 🔹 Načtení disciplín
    useEffect(() => {
        if (!competition) return;

        getCompetitionDisciplines(id)
            .then(data => {
                setDisciplines(data || []);
                setLoadingDisciplines(false);
            })
            .catch(err => {
                console.error("Fetch disciplines error:", err);
                setLoadingDisciplines(false);
            });
    }, [competition, id]);

    if (loading) return <p style={{ textAlign: "center" }}>Načítám soutěž...</p>;
    if (!competition) return <p style={{ textAlign: "center" }}>Soutěž nenalezena.</p>;
    const canEditCompetition =
        user &&
        (
            user.active_role === "admin" ||
            (
                user.active_role === "organizator" &&
                competition.owner_id === user.user_id
            )
        );

    const canExport =
        user &&
        (
            user.roles.includes("admin") ||
            (user.roles.includes("organizator") &&
                user.user_id === competition.owner_id)
        );

    async function exportPdf() {
        try {

            const res = await fetch(
                // `${import.meta.env.VITE_API_URL}/competitions/${id}/export/pdf`,
                `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/competitions/${id}/export/pdf`,
                {
                    credentials: "include"
                }
            );

            if (!res.ok) {
                throw new Error("Export se nezdařil");
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `prihlasky_${competition.name}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("PDF export error:", err);
            alert("Nepodařilo se exportovat PDF");
        }
    }


    return (
        <div className="detail-container">

            <button
                className="back-btn"
                onClick={() => navigate('/')}
            >
                ← Zpět na seznam soutěži
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

                {canEditCompetition && (
                    <button
                        className="edit-btn"
                        onClick={() => navigate(`/competitions/${id}/edit`)}
                    >
                        ⚙ Správa soutěže
                    </button>
                )}

                {canExport && (
                    <button className="btn-outline" onClick={exportPdf}>
                        📄 Export přihlášek (PDF)
                    </button>
                )}
                {canEditCompetition && (
                    <button
                        className="btn-danger"
                        onClick={async () => {
                            const ok = confirm(
                                "⚠️ OPRAVDU chcete smazat tuto soutěž?\n\n" +
                                "Tato akce je nevratná a odstraní soutěž ze systému."
                            );
                            if (!ok) return;

                            try {
                                await api.delete(`/competitions/${competition.competition_id}`);
                                alert("Soutěž byla smazána");
                                navigate("/");
                            } catch (err) {
                                alert(
                                    err.response?.data?.error ||
                                    "Soutěž nelze smazat"
                                );
                            }
                        }}
                    >
                        🗑 Smazat soutěž
                    </button>
                )}
            </div>
        </div>
    );
}
