import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/home.css";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import {getCompetitions} from "../api/competitionApi.js";
import { formatDate } from "../utils/date";

export default function Home() {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    const canCreateCompetition =
        user?.roles?.some(r =>
            ["admin", "organizator"].includes(
                typeof r === "string" ? r : r.role
            )
        );
    console.log("USER:", user);
    console.log("ROLES:", user?.roles);
    const [filters, setFilters] = useState({
        status: "all",
        time: "all",
        discipline: ""
    });
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const timeout = setTimeout(() => {
            loadCompetitions();
        }, 300);

        return () => clearTimeout(timeout);
    }, [filters]);

    const loadCompetitions = async () => {
        try {
            const params = {};

            if (filters.status !== "all") params.status = filters.status;
            if (filters.time !== "all") params.time = filters.time;
            if (filters.discipline) params.discipline = filters.discipline;

            const res = await api.get("/competitions", { params });
            setCompetitions(res.data);
        } catch (err) {
            console.error("Error loading competitions:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="logo">Czech Jump Rope</div>
                <nav className="nav-buttons">
                    {!user ? (
                        <>
                            <button onClick={() => navigate("/login")} className="nav-btn">
                                Přihlásit se
                            </button>
                            <button onClick={() => navigate("/register")} className="nav-btn-outline">
                                Registrovat
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="nav-user">👤 {user.first_name}</span>

                            <button
                                onClick={() => navigate("/profile")}
                                className="nav-btn-outline"
                            >
                                Profil
                            </button>

                            <button
                                onClick={logout}
                                className="nav-btn"
                            >
                                Odhlásit se
                            </button>
                        </>
                    )}
                </nav>
            </header>

            <section className="hero">
                <h1>Sportovní registrace jednoduše</h1>
                <p>
                    Přihlašujte sebe nebo svůj tým do soutěží v rope skippingu rychle a přehledně.
                </p>
            </section>
            {user && (
                <button
                    className="btn-outline"
                    onClick={() => navigate("/my-registrations")}
                >
                    📋 Moje přihlášky
                </button>
            )}
            <section className="competitions-preview">
                <h2>Soutěže</h2>


                <div className="filter-bar">
                    <select
                        value={filters.status}
                        onChange={e => setFilters(f => ({...f, status: e.target.value}))}
                    >
                        <option value="all">Všechny registrace</option>
                        <option value="open">Registrace otevřená</option>
                        <option value="closed">Registrace zavřená</option>
                    </select>

                    <select
                        value={filters.time}
                        onChange={e => setFilters(f => ({...f, time: e.target.value}))}
                    >
                        <option value="all">Všechny soutěže</option>
                        <option value="upcoming">Nadcházející</option>
                        <option value="past">Proběhlé</option>
                    </select>

                    <input
                        placeholder="Hledat disciplínu…"
                        value={filters.discipline}
                        onChange={e =>
                            setFilters(f => ({...f, discipline: e.target.value}))
                        }
                    />
                </div>

                {/* Žádné soutěže */}
                {!loading && competitions.length === 0 && (
                    <div className="competition-placeholder">
                        <p>Brzy zde uvidíte seznam aktivních soutěží.</p>
                    </div>
                )}
                {/* Seznam soutěží */}
                <div className="competition-list">
                    {canCreateCompetition && (
                        <div
                            className="competition-card create-card"
                            onClick={() => navigate("/competitions/new")}
                        >
                            <div className="plus">＋</div>
                            <p>Vytvořit novou soutěž</p>
                        </div>
                    )}
                    {competitions.map((c) => (
                        <div key={c.competition_id} className="competition-card">
                            <h3>{c.name}</h3>
                            <p><strong>Lokace:</strong> {c.location || "Neuvedeno"}</p>
                            <p><strong>Datum:</strong> {formatDate(c.start_date)}</p>
                            <button
                                className="card-btn"
                                onClick={() => navigate(`/competitions/${c.competition_id}`)}
                            >
                                Detail soutěže
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="home-footer">
                © {new Date().getFullYear()} Czech Jump Rope Federation
            </footer>
        </div>
    );
}
