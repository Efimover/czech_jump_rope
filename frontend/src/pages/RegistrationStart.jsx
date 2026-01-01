import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";
import "../styles/registrationStart.css";

export default function RegistrationStart() {
    const { user, authLoading, switchRole } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const competition_id = params.get("competition");

    const allowedRoles = ["user", "soutezici"];

    const [competition, setCompetition] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState("checking"); // checking | switch-role | confirm | done
    const [selectedRole, setSelectedRole] = useState(null);

    // ===============================
    // INIT
    // ===============================
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate("/login");
            return;
        }

        if (!competition_id) {
            setError("ID soutěže nebylo předáno.");
            setLoading(false);
            return;
        }

        //role není povolená
        if (!allowedRoles.includes(user.active_role)) {
            const possible = user.roles?.filter(r =>
                allowedRoles.includes(r)
            );

            if (!possible || possible.length === 0) {
                setError("Nemáte oprávnění se přihlásit do soutěže.");
                setLoading(false);
                return;
            }

            setSelectedRole(possible[0]);
            setStep("switch-role");
            setLoading(false);
            return;
        }

        // role OK
        loadCompetition();

    }, [authLoading, user, competition_id]);

    // ===============================
    // LOAD COMPETITION
    // ===============================
    async function loadCompetition() {
        try {
            setLoading(true);

            const res = await api.get(`/competitions/${competition_id}`);
            const comp = res.data;
            setCompetition(comp);

            const check = await api.get(`/registrations/check`, {
                params: { competition_id }
            });

            if (check.data.exists) {
                navigate(`/registrations/${check.data.registration_id}`);
                return;
            }

            const today = new Date();
            if (today < new Date(comp.reg_start) || today > new Date(comp.reg_end)) {
                setError("Registrace do soutěže momentálně není otevřena.");
                return;
            }

            setStep("confirm");
        } catch (err) {
            console.error(err);
            setError("Nepodařilo se načíst údaje o soutěži.");
        } finally {
            setLoading(false);
        }
    }

    // ===============================
    // CREATE REGISTRATION
    // ===============================
    async function createRegistration() {
        try {
            const res = await api.post("/registrations", {
                competition_id,
                contact_name: `${user.first_name} ${user.last_name}`,
                contact_email: user.email
            });

            const newId = res.data.registration.registration_id;
            setStep("done");

            setTimeout(() => {
                navigate(`/registrations/${newId}`);
            }, 800);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                "Přihlášku se nepodařilo vytvořit."
            );
        }
    }

    // ===============================
    // RENDER
    // ===============================
    if (authLoading || loading) {
        return <p className="loading-center">Kontroluji možnost registrace…</p>;
    }

    return (
        <div className="regstart-container">
            <div className="regstart-card">
                <h1>Přihlášení do soutěže</h1>

                {error && <div className="regstart-error">❗ {error}</div>}

                {/* SWITCH ROLE */}
                {step === "switch-role" && (
                    <>
                        <p>
                            Pro vytvoření přihlášky je nutné přepnout roli:
                        </p>

                        <select
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value)}
                        >
                            {user.roles
                                .filter(r => allowedRoles.includes(r))
                                .map(r => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                        </select>

                        <div className="regstart-buttons">
                            <button
                                className="btn-primary"
                                onClick={async () => {
                                    try {
                                        await switchRole(selectedRole);
                                        loadCompetition();
                                    } catch {
                                        setError("Nepodařilo se přepnout roli.");
                                    }
                                }}
                            >
                                Přepnout roli a pokračovat
                            </button>

                            <button
                                className="btn-outline"
                                onClick={() => navigate(-1)}
                            >
                                Zpět
                            </button>
                        </div>
                    </>
                )}

                {/* CONFIRM */}
                {step === "confirm" && competition && (
                    <>
                        <p>
                            Chystáte se přihlásit do soutěže:
                            <br />
                            <strong>{competition.name}</strong>
                        </p>

                        <p>
                            <strong>Registrace:</strong>{" "}
                            {competition.reg_start} – {competition.reg_end}
                        </p>

                        <div className="regstart-buttons">
                            <button className="btn-primary" onClick={createRegistration}>
                                Ano, vytvořit přihlášku
                            </button>

                            <button className="btn-outline" onClick={() => navigate(-1)}>
                                Zpět
                            </button>
                        </div>
                    </>
                )}

                {/* DONE */}
                {step === "done" && (
                    <p className="regstart-success">
                        ✔ Přihláška byla úspěšně vytvořena…
                    </p>
                )}
            </div>
        </div>
    );
}
