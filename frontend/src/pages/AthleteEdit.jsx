import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/athleteAdd.css";

export default function AthleteEdit() {
    const { athleteId } = useParams();
    const navigate = useNavigate();


    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        birth_year: "",
        gender: ""
    });

    useEffect(() => {
        loadAthlete();
    }, [athleteId]);

    // if (!canEdit) {
    //     return <p>Nemáte oprávnění upravovat závodníka</p>;
    // }

    async function loadAthlete() {
        try {
            const res = await api.get(`/athletes/${athleteId}`);
            setForm({
                first_name: res.data.first_name,
                last_name: res.data.last_name,
                birth_year: res.data.birth_year,
                gender: res.data.gender
            });
        } catch (err) {
            alert("Nepodařilo se načíst závodníka");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }

    async function submit() {
        try {
            await api.put(`/athletes/${athleteId}`, form);
            navigate(-1); // zpět na detail přihlášky
        } catch (err) {
            alert(err.response?.data?.error || "Nelze uložit změny");
        }
    }

    if (loading) return <p className="loading">Načítám…</p>;

    return (
        <div className="athlete-wrapper">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Zpět
            </button>

            <div className="athlete-card">
                <h1>Upravit závodníka</h1>

                {/* Osobní údaje */}
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
                                    value={g}
                                    checked={form.gender === g}
                                    onChange={() =>
                                        setForm({ ...form, gender: g })
                                    }
                                />
                                {g === "M"
                                    ? " Chlapec"
                                    : g === "F"
                                        ? " Dívka"
                                        : " Jiný"}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Akce */}
                <div className="action-row">
                    <button className="btn-primary" onClick={submit}>
                        Uložit změny
                    </button>

                    <button
                        className="btn-outline"
                        onClick={() => navigate(-1)}
                    >
                        Zrušit
                    </button>
                </div>
            </div>
        </div>
    );
}
