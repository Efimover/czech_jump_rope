import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/athleteAdd.css";

export default function AthleteAdd() {
    const { teamId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        birth_year: "",
        gender: ""
    });

    async function submit() {
        try {
            await api.post(`/athletes/by-team/${teamId}`, form);
            navigate(-1);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Nelze uložit závodníka.");
        }
    }

    return (
        <div className="athlete-wrapper">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Zpět
            </button>

            <div className="athlete-card">
                <h1>Přidat závodníka</h1>

                <div className="form-section">
                    <h2>Osobní údaje</h2>

                    <input
                        placeholder="Jméno"
                        value={form.first_name}
                        onChange={e =>
                            setForm({ ...form, first_name: e.target.value })
                        }
                    />

                    <input
                        placeholder="Příjmení"
                        value={form.last_name}
                        onChange={e =>
                            setForm({ ...form, last_name: e.target.value })
                        }
                    />

                    <input
                        placeholder="Rok narození"
                        type="number"
                        value={form.birth_year}
                        onChange={e =>
                            setForm({ ...form, birth_year: e.target.value })
                        }
                    />

                    <div className="gender-row">
                        {["M", "F", "X"].map(g => (
                            <label key={g}>
                                <input
                                    type="radio"
                                    checked={form.gender === g}
                                    onChange={() =>
                                        setForm({ ...form, gender: g })
                                    }
                                />
                                {g}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="action-row">
                    <button className="btn-primary" onClick={submit}>
                        Uložit závodníka
                    </button>
                    <button className="btn-outline" onClick={() => navigate(-1)}>
                        Zrušit
                    </button>
                </div>
            </div>
        </div>
    );
}
