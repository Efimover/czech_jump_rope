import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/athleteAdd.css";

export default function AthleteAdd() {
    const { registrationId } = useParams();
    const navigate = useNavigate();

    const [disciplines, setDisciplines] = useState([]);
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        birth_year: "",
        gender: "",
        disciplines: []
    });

    useEffect(() => {
        async function load() {
            try {
                // 1) načti registraci
                const reg = await api.get(`/registrations/${registrationId}`);
                const competition_id = reg.data.competition_id;

                // 2) načti disciplíny soutěže
                const d = await api.get(`/disciplines/competition/${competition_id}`);
                setDisciplines(d.data);
            } catch (err) {
                console.error(err);
                alert("Nepodařilo se načíst disciplíny.");
            }
        }
        load();
    }, []);

    function toggleDiscipline(id) {
        setForm(prev => ({
            ...prev,
            disciplines: prev.disciplines.includes(id)
                ? prev.disciplines.filter(x => x !== id)
                : [...prev.disciplines, id]
        }));
    }

    async function submit() {
        try {
            await api.post(`/registrations/${registrationId}/athletes`, form);
            navigate(`/registrations/${registrationId}`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Nelze uložit závodníka.");
        }
    }

    return (
        <div className="athlete-wrapper">
            <button className="back-btn" onClick={() => navigate(-1)}>← Zpět</button>

            <div className="athlete-card">
                <h1>Přidat závodníka</h1>

                {/* Osobní údaje */}
                <div className="form-section">
                    <h2>Osobní údaje</h2>

                    <input
                        placeholder="Jméno"
                        value={form.first_name}
                        onChange={e => setForm({ ...form, first_name: e.target.value })}
                    />

                    <input
                        placeholder="Příjmení"
                        value={form.last_name}
                        onChange={e => setForm({ ...form, last_name: e.target.value })}
                    />

                    <input
                        placeholder="Rok narození"
                        type="number"
                        value={form.birth_year}
                        onChange={e => setForm({ ...form, birth_year: e.target.value })}
                    />

                    <div className="gender-row">
                        <label>
                            <input
                                type="radio"
                                value="M"
                                checked={form.gender === "M"}
                                onChange={() => setForm({ ...form, gender: "M" })}
                            /> Chlapec
                        </label>

                        <label>
                            <input
                                type="radio"
                                value="F"
                                checked={form.gender === "F"}
                                onChange={() => setForm({ ...form, gender: "F" })}
                            /> Dívka
                        </label>

                        <label>
                            <input
                                type="radio"
                                value="X"
                                checked={form.gender === "X"}
                                onChange={() => setForm({ ...form, gender: "X" })}
                            /> Jiný
                        </label>
                    </div>
                </div>

                {/* Disciplíny */}
                <div className="form-section">
                    <h2>Výběr disciplín</h2>

                    <div className="discipline-list">
                        {disciplines.map(d => (
                            <div
                                key={d.discipline_id}
                                className={
                                    form.disciplines.includes(d.discipline_id)
                                        ? "discipline-card selected"
                                        : "discipline-card"
                                }
                                onClick={() => toggleDiscipline(d.discipline_id)}
                            >
                                <h3>{d.name}</h3>
                                <span className="age">
                                    Kategorie: {d.age_categories?.join(", ") || "neuvedeno"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Akce */}
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
