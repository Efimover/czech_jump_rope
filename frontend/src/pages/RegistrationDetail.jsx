import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/registrationDetail.css";

export default function RegistrationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [registration, setRegistration] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/registrations/${id}`)
            .then((res) => {
                setRegistration(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                alert("Nepodařilo se načíst přihlášku.");
                navigate("/");
            });
    }, [id]);

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

                {/* Upravit pouze pokud není odesláno */}
                {registration.status !== "submitted" && (
                    <button className="btn-outline">
                        Upravit údaje
                    </button>
                )}
            </div>


            {/* DISCIPLÍNY */}
            <div className="section-card">
                <h2>Disciplíny</h2>

                <p className="placeholder">Zatím žádné disciplíny nepřidané.</p>

                {registration.status !== "submitted" && (
                    <button className="btn-primary">Přidat disciplínu</button>
                )}
            </div>

        </div>
    );
}
