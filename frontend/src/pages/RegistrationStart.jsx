import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";
import "../styles/registrationStart.css";

export default function RegistrationStart() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const competition_id = params.get("competition");

    const [competition, setCompetition] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState("checking"); // checking → confirm → done

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!competition_id) {
            setError("ID soutěže nebylo předáno.");
            return;
        }

        loadCompetition();
    }, []);

    async function loadCompetition() {
        try {
            // 1️⃣ Načtení soutěže
            const res = await api.get(`/competitions/${competition_id}`);
            const comp = res.data;
            setCompetition(comp);

            // 2Kontrola registrace
            const check = await api.get(`/registrations/check`, {
                params: { competition_id }
            });

            if (check.data.exists) {
                // Existuje → přesměřovat
                navigate(`/registrations/${check.data.registration_id}`);
                return;
            }

            // 3️⃣ Kontrola období registrace
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
            console.error(err);
            setError(
                err.response?.data?.error ||
                "Přihlášku se nepodařilo vytvořit."
            );
        }
    }

    if (loading) return <p className="loading-center">Kontroluji možnost registrace…</p>;

    return (
        <div className="regstart-container">
            <div className="regstart-card">
                <h1>Přihlášení do soutěže</h1>

                {error && (
                    <div className="regstart-error">
                        ❗ {error}
                    </div>
                )}

                {step === "confirm" && competition && (
                    <>
                        <p>
                            Chystáte se přihlásit do soutěže:
                            <br />
                            <strong>{competition.name}</strong>
                        </p>

                        <p><strong>Registrace:</strong> {competition.reg_start} – {competition.reg_end}</p>

                        <div className="regstart-buttons">
                            <button
                                className="btn-primary"
                                onClick={createRegistration}
                            >
                                Ano, vytvořit přihlášku
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

                {step === "done" && (
                    <p className="regstart-success">
                        ✔ Přihláška byla úspěšně vytvořena…
                    </p>
                )}
            </div>
        </div>
    );
}
