import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/home.css";
import { AuthContext } from "../context/AuthContext";
import { formatDate } from "../utils/date";

export default function Home() {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    const [filters, setFilters] = useState({
        status: "all",
        time: "all",
        discipline: ""
    });
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [switchingRole, setSwitchingRole] = useState(false);

    const canManageRegistrations =
        user?.active_role === "admin" ||
        user?.active_role === "organizator";

    // ACTIVE ROLE
    const canCreateCompetition =
        user?.active_role === "admin" ||
        user?.active_role === "organizator";

    // ACTIVE ROLE
    const canManageUsers =
        user?.roles?.includes("admin");

    // ---------------- LOAD COMPETITIONS ----------------
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

    // ---------------- SWITCH ROLE ----------------
    const switchRole = async (newRole) => {
        if (newRole === user.active_role) return;

        try {
            setSwitchingRole(true);

            const res = await api.put("/users/me/active-role", {
                role: newRole
            });

            const updatedUser = {
                ...user,
                active_role: res.data.active_role
            };

            localStorage.setItem("user", JSON.stringify(updatedUser));
            window.location.reload(); // jednoduché & spolehlivé
        } catch (err) {
            alert(err.response?.data?.error || "Nepodařilo se přepnout roli");
        } finally {
            setSwitchingRole(false);
        }
    };

    return (
        <div className="home-container">
            {/* ================= HEADER ================= */}
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
                            {/* 👤 USER + ROLE */}
                            <div className="role-switcher">
                                <span className="nav-user">
                                    👤 {user.first_name}
                                </span>

                                {user.roles?.length > 1 && (
                                    <select
                                        value={user.active_role}
                                        onChange={e => switchRole(e.target.value)}
                                        disabled={switchingRole}
                                    >
                                        {user.roles.map(r => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button
                                onClick={() => navigate("/profile")}
                                className="nav-btn-outline"
                            >
                                Profil
                            </button>

                            <button onClick={logout} className="nav-btn">
                                Odhlásit se
                            </button>
                        </>
                    )}
                </nav>
            </header>

            {/* ================= HERO ================= */}
            <section className="hero">
                <h1>Sportovní registrace jednoduše</h1>
                <p>
                    Přihlašujte sebe nebo svůj tým do soutěží v rope skippingu rychle a přehledně.
                </p>
            </section>

            {user && (
                <div className="home-actions">
                    {/* soutěžící */}
                    <button
                        className="btn-outline"
                        onClick={() => navigate("/my-registrations")}
                    >
                        📋 Moje přihlášky
                    </button>

                    {/* admin / organizátor */}
                    {canManageRegistrations && (
                        <button
                            className="btn-outline"
                            onClick={() => navigate("/registrations")}
                        >
                            🗂 Všechny přihlášky
                        </button>
                    )}

                    {/* admin  */}
                    {canManageUsers && (
                        <button
                            className="btn-outline"
                            onClick={() => navigate("/admin")}
                        >
                            🗂 Všechny uživatele
                        </button>
                    )}

                </div>
            )}

            {/* ================= COMPETITIONS ================= */}
            <section className="competitions-preview">
                <h2>Soutěže</h2>

                <div className="filter-bar">
                    <select
                        value={filters.status}
                        onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    >
                        <option value="all">Všechny registrace</option>
                        <option value="open">Registrace otevřená</option>
                        <option value="closed">Registrace zavřená</option>
                    </select>

                    <select
                        value={filters.time}
                        onChange={e => setFilters(f => ({ ...f, time: e.target.value }))}
                    >
                        <option value="all">Všechny soutěže</option>
                        <option value="upcoming">Nadcházející</option>
                        <option value="past">Proběhlé</option>
                    </select>

                    <input
                        placeholder="Hledat disciplínu…"
                        value={filters.discipline}
                        onChange={e =>
                            setFilters(f => ({ ...f, discipline: e.target.value }))
                        }
                    />
                </div>

                {!loading && competitions.length === 0 && (
                    <div className="competition-placeholder">
                        <p>Brzy zde uvidíte seznam aktivních soutěží.</p>
                    </div>
                )}

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

                    {competitions.map(c => (
                        <div key={c.competition_id} className="competition-card">
                            <h3>{c.name}</h3>
                            <p><strong>Lokace:</strong> {c.location || "Neuvedeno"}</p>
                            <p><strong>Datum:</strong> {formatDate(c.start_date)}</p>
                            <button
                                className="card-btn"
                                onClick={() =>
                                    navigate(`/competitions/${c.competition_id}`)
                                }
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
