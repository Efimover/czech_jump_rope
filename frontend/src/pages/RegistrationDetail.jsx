import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/registrationDetail.css";

export default function RegistrationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [registration, setRegistration] = useState(null);
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRegistration();
        loadAthletes();
    }, [id]);

    async function loadRegistration() {
        try {
            const res = await api.get(`/registrations/${id}`);
            setRegistration(res.data);
        } catch (err) {
            console.error(err);
            alert("Nepodařilo se načíst přihlášku.");
            navigate("/");
        } finally {
            setLoading(false);
        }
    }

    async function loadAthletes() {
        try {
            const res = await api.get(`/athletes/by-registration/${id}`);
            setAthletes(res.data);
        } catch (err) {
            console.error("Error loading athletes", err);
        }
    }

    if (loading) return <p className="loading">Načítám přihlášku...</p>;
    if (!registration) return null;

    return (
        <div className="reg-wrapper">

            {/* ZPĚT */}
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Zpět
            </button>

            {/* HLAVNÍ KARTA */}
            <div className="reg-card">
                <h1>{registration.competition_name}</h1>

                <div className="reg-meta">
                    <span>Přihláška #{registration.registration_id}</span>

                    <span className={`status ${registration.status}`}>
                        {registration.status}
                    </span>
                </div>

                <div className="reg-dates">
                    <p><strong>Vytvořeno:</strong> {registration.created_at?.slice(0, 10)}</p>
                    <p><strong>Upraveno:</strong> {registration.updated_at?.slice(0, 10)}</p>
                </div>
            </div>

            {/* ZÁKLADNÍ ÚDAJE */}
            <div className="section-card">
                <h2>Základní údaje</h2>

                <div className="row">
                    <strong>Kontakt:</strong>
                    <span>{registration.contact_name}</span>
                </div>

                <div className="row">
                    <strong>Email:</strong>
                    <span>{registration.contact_email}</span>
                </div>

                {registration.status !== "submitted" && (
                    <button className="btn-outline">
                        Upravit údaje
                    </button>
                )}
            </div>

            {/* ZÁVODNÍCI */}
            <div className="section-card">
                <h2>Závodníci</h2>

                {athletes.length === 0 && (
                    <p className="placeholder">Zatím nebyl přidán žádný závodník.</p>
                )}

                {athletes.map((a) => (
                    <div key={a.athlete_id} className="athlete-card">
                        <strong>{a.first_name} {a.last_name}</strong>
                        <p>Rok narození: {a.birth_year}</p>
                        <p>Pohlaví: {a.gender}</p>

                        <div className="athlete-disciplines">
                            {a.disciplines?.length > 0 ? (
                                a.disciplines.map((d) => (
                                    <span key={d.discipline_id} className="disc-tag">
                                        {d.name}
                                    </span>
                                ))
                            ) : (
                                <p className="placeholder">Bez disciplín</p>
                            )}
                        </div>
                    </div>
                ))}

                {registration.status !== "submitted" && (
                    <button
                        className="btn-primary"
                        onClick={() => navigate(`/registrations/${id}/athletes/new`)}
                    >
                        ➕ Přidat závodníka
                    </button>
                )}
                <p className="placeholder">Zatim nemas zadne zavodniky</p>
            </div>
        </div>
    );
}
