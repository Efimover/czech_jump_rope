import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/registrationDetail.css";
import DisciplineGrid from "./DisciplineGrid.jsx";
import AthleteCard from "./AthleteCard.jsx";

export default function RegistrationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [registration, setRegistration] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRegistration();
        loadTeamsWithAthletes();
    }, [id]);

    async function loadTeams() {
        const res = await api.get(`/teams/by-registration/${id}`);
        setTeams(res.data);
    }

    async function loadTeamsWithAthletes() {
        const teamsRes = await api.get(`/teams/by-registration/${id}`);

        const teamsWithAthletes = await Promise.all(
            teamsRes.data.map(async team => {
                const athletesRes = await api.get(`/athletes/by-team/${team.team_id}`);
                return {
                    ...team,
                    athletes: athletesRes.data
                };
            })
        );

        setTeams(teamsWithAthletes);
    }
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
    async function createTeam() {
        const name = prompt("Zadejte název týmu:");
        if (!name) return;

        try {
            await api.post(`/teams/by-registration/${id}`, { name });
            await loadTeamsWithAthletes(); // refresh dat
        } catch (err) {
            alert("Nepodařilo se vytvořit tým");
        }
    }

    async function deleteAthlete(athleteId, teamId) {
        if (!confirm("Opravdu chcete závodníka smazat?")) return;

        try {
            await api.delete(`/athletes/${athleteId}`);
            await loadTeamsWithAthletes(); // refresh
        } catch (err) {
            alert("Nepodařilo se smazat závodníka");
        }
    }

    async function submitRegistration() {
        if (!confirm("Opravdu chceš odeslat přihlášku? Po odeslání již nepůjde upravovat.")) {
            return;
        }

        try {
            await api.post(`/registrations/${id}/submit`);
            alert("Přihláška byla úspěšně odeslána");
            await loadRegistration(); // refresh stavu
        } catch (err) {
            alert(
                err.response?.data?.error ||
                "Přihlášku se nepodařilo odeslat"
            );
        }
    }

    async function deleteRegistration() {
        const ok = confirm(
            "Opravdu chceš smazat přihlášku?\n" +
            "Všechna data (týmy, závodníci, disciplíny) budou nenávratně odstraněna."
        );

        if (!ok) return;

        try {
            await api.delete(`/registrations/${id}`);
            alert("Přihláška byla smazána");
            navigate("/"); // nebo seznam přihlášek
        } catch (err) {
            alert(
                err.response?.data?.error ||
                "Přihlášku se nepodařilo smazat"
            );
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

                {teams.length === 0 && (
                    <>
                        <p className="placeholder">
                            Zatím nebyl vytvořen žádný tým.
                        </p>

                        {registration.status === "saved" && (
                            <button
                                className="btn-primary"
                                onClick={createTeam}
                            >
                                ➕ Vytvořit tým
                            </button>
                        )}
                    </>
                )}

                {teams.map(team => (
                    <div key={team.team_id} className="team-card">
                        <h3>{team.name}</h3>

                        {team.athletes?.length > 0 ? (
                            team.athletes.map(a => (
                                <AthleteCard
                                    key={a.athlete_id}
                                    athlete={a}
                                    readOnly={registration.status === "submitted"}
                                    onEdit={() =>
                                        navigate(`/athletes/${a.athlete_id}/edit`)
                                    }
                                    onDelete={() => deleteAthlete(a.athlete_id, team.team_id)}
                                />
                            ))
                        ) : (
                            <p className="placeholder">Zatím žádní závodníci</p>
                        )}

                        {registration.status !== "submitted" && (
                            <button
                                className="btn-primary"
                                onClick={() =>
                                    navigate(`/teams/${team.team_id}/athletes/new`)
                                }
                            >
                                ➕ Přidat závodníka
                            </button>
                        )}
                    </div>
                ))}

                {/* 👇 GRID PATŘÍ SEM */}
                {teams.length > 0 && (
                    <DisciplineGrid
                        registrationId={id}
                        competitionId={registration.competition_id}
                        teams={teams}
                        readOnly={registration.status === "submitted"}
                    />
                )}
            </div>
            {registration.status === "saved" && (
                <button
                    className="btn-primary"
                    onClick={submitRegistration}
                >
                    ✔ Odeslat přihlášku
                </button>
            )}
            {registration.status === "saved" && (
                <div className="danger-zone">
                    <button
                        className="btn-danger"
                        onClick={deleteRegistration}
                    >
                        🗑 Smazat přihlášku
                    </button>
                </div>
            )}

        </div>
    );
}
