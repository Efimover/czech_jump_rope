import React, {useContext, useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/registrationDetail.css";
import DisciplineGrid from "./DisciplineGrid.jsx";
import AthleteCard from "./AthleteCard.jsx";
import {AuthContext} from "../context/AuthContext.jsx";

export default function RegistrationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [registration, setRegistration] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const [auditLog, setAuditLog] = useState([]);
    const isOwner = Boolean(
        registration && user.user_id === registration.user_id
    );

    const canEdit =
        isOwner && registration?.status === "saved";


    const canReopen =
        user.active_role === "admin" ||
        user.active_role === "organizator";

    useEffect(() => {
        loadRegistration();
        loadTeamsWithAthletes();
    }, [id]);


    async function loadAuditLog() {
        const res = await api.get(`/registrations/${id}/audit-log`);
        setAuditLog(res.data);
    }
    useEffect(() => {
        loadAuditLog();
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
    async function reopen() {
        const ok = confirm(
            "Opravdu chcete vrátit přihlášku k úpravám?\n" +
            "Vlastník přihlášky ji bude moci znovu upravovat."
        );
        if (!ok) return;

        await api.post(`/registrations/${registration.registration_id}/reopen`);
        loadRegistration();
    }

    async function submitRegistration() {
        if (
            !confirm(
                "Opravdu chceš odeslat přihlášku?\n" +
                "Po odeslání již nepůjde upravovat."
            )
        ) {
            return;
        }

        try {
            await api.post(`/registrations/${id}/submit`);
            alert("Přihláška byla úspěšně odeslána");
            await loadRegistration();
        } catch (err) {
            if (err.response?.data?.code === "INCOMPLETE_TEAMS") {
                alert("Některé týmové disciplíny nemají plný počet závodníků.");
            } else {
                alert(
                    err.response?.data?.error ||
                    "Přihlášku nelze odeslat."
                );
            }
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

                {canEdit && (
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

                        {canEdit && (
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
                                    athlete={a}
                                    readOnly={!canEdit}
                                    onEdit={canEdit ? () =>
                                            navigate(`/athletes/${a.athlete_id}/edit`)
                                        : undefined
                                    }
                                    onDelete={canEdit
                                        ? () => deleteAthlete(a.athlete_id, team.team_id)
                                        : undefined
                                    }
                                />
                            ))
                        ) : (
                            <p className="placeholder">Zatím žádní závodníci</p>
                        )}

                        {canEdit && registration.status !== "submitted" && (
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

                {/*  GRID  */}
                {teams.length > 0 && (
                    <DisciplineGrid
                    registrationId={id}
                    competitionId={registration.competition_id}
                    teams={teams}
                    readOnly={!canEdit}
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

            {canReopen && registration.status === "submitted" && (
                <button
                    className="btn-warning"
                    onClick={reopen}
                >
                    🔓 Vrátit k úpravám
                </button>
            )}

            <div className="section-card">
                <h2>Historie změn</h2>

                {auditLog.length === 0 && (
                    <p className="placeholder">Žádné záznamy</p>
                )}

                {auditLog.map(log => (
                    <div key={log.audit_id} className="audit-row">
                        <strong>{log.action}</strong>
                        <span>
                {log.actor_email} ({log.actor_role})
            </span>
                        <span>
                {new Date(log.created_at).toLocaleString()}
            </span>
                        {log.message && <em>{log.message}</em>}
                    </div>
                ))}
            </div>

        </div>
    );
}
