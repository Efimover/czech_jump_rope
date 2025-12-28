import React, {useContext, useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import { formatDate } from "../utils/date";
import "../styles/myRegistrations.css";
import { AuthContext } from "../context/AuthContext";

export default function MyRegistrations() {
    const { user } = useContext(AuthContext);
    const [registrations, setRegistrations] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    if (!user) {
        return (
            <div className="page-wrapper">
                <div className="empty-state">
                    <h2>Moje přihlášky</h2>

                    <p>
                        Pro zobrazení svých přihlášek se prosím přihlaste do systému.
                    </p>

                    <button
                        className="btn-primary"
                        onClick={() => navigate("/login")}
                    >
                        🔐 Přihlásit se
                    </button>
                </div>
            </div>
        );
    }

    const filtered = React.useMemo(() => {
        if (filter === "all") return registrations;
        return registrations.filter(r => r.status === filter);
    }, [registrations, filter]);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            const res = await api.get("/registrations/my");
            setRegistrations(res.data);
        } catch (err) {
            alert("Nepodařilo se načíst přihlášky");
        } finally {
            setLoading(false);
        }
    }
    async function deleteRegistration(id) {
        const ok = confirm(
            "Opravdu chcete smazat přihlášku?\n" +
            "Tato akce je nevratná."
        );
        if (!ok) return;

        try {
            await api.delete(`/registrations/${id}`);
            setRegistrations(prev => prev.filter(r => r.registration_id !== id));
        } catch (err) {
            alert(
                err.response?.data?.error ||
                "Přihlášku se nepodařilo smazat"
            );
        }
    }


    if (loading) return <p>Načítám…</p>;

    return (
        <div className="page-wrapper">
            <h1>Moje přihlášky</h1>
            <div className="filter-row">
                <button
                    className={filter === "all" ? "active" : ""}
                    onClick={() => setFilter("all")}
                >
                    Vše
                </button>

                <button
                    className={filter === "saved" ? "active" : ""}
                    onClick={() => setFilter("saved")}
                >
                    Rozpracované
                </button>

                <button
                    className={filter === "submitted" ? "active" : ""}
                    onClick={() => setFilter("submitted")}
                >
                    Odeslané
                </button>
            </div>

            {filtered.length === 0 && registrations.length > 0 && (
                <p>Pro zvolený filtr nejsou žádné přihlášky.</p>
            )}


            {filtered.map(r => (
                <div key={r.registration_id} className="reg-card">
                    <div className="reg-header">
                        <h3>{r.competition_name}</h3>

                        <span className={`status ${r.status}`}>
            {r.status === "saved" ? "Rozpracovaná" : "Odeslaná"}
        </span>
                    </div>

                    <div className="reg-disciplines">
                        {r.disciplines?.length > 0 ? (
                            r.disciplines.map(d => (
                                <span key={d} className="discipline-chip">
                    {d}
                </span>
                            ))
                        ) : (
                            <span className="empty">Bez disciplín</span>
                        )}
                    </div>

                    <div className="reg-actions">
                        <button
                            className="btn-outline"
                            onClick={() => navigate(`/registrations/${r.registration_id}`)}
                        >
                            👁 Detail
                        </button>

                        {r.status !== "submitted" && (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate(`/registrations/${r.registration_id}`)}
                                >
                                    ✏️ Upravit
                                </button>

                                <button
                                    className="btn-danger"
                                    onClick={() => deleteRegistration(r.registration_id)}
                                >
                                    🗑 Smazat
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
