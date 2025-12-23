import {useNavigate} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import api from "../api/apiClient.js";
import {AuthContext} from "../context/AuthContext.jsx";

export default function CreateCompetition() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedDisciplines, setSelectedDisciplines] = useState([]);
    const [referees, setReferees] = useState([]);
    const [mode, setMode] = useState("select");

    useEffect(() => {
        api.get("/referees").then(res => setReferees(res.data));
    }, []);

    const [form, setForm] = useState({
        name: "",
        description: "",
        location: "",
        start_date: "",
        end_date: "",
        reg_start: "",
        reg_end: "",
        referee_id: null
    });

    const [newReferee, setNewReferee] = useState({
        first_name: "",
        last_name: "",
        category: ""
    });

    async function submit() {
        const res = await api.post("/competitions", form);
        const competitionId = res.data.competition.competition_id;

        for (const dId of selectedDisciplines) {
            await api.post("/disciplines/assign", {
                competition_id: competitionId,
                discipline_id: dId
            });
        }

        navigate(`/competitions/${competitionId}`);
    }

    return (
        <div className="page-wrapper">
            <h1>Nová soutěž</h1>

            <div className="form-card">
                <input
                    placeholder="Název soutěže"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                />

                <textarea
                    placeholder="Popis"
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                />

                <input
                    placeholder="Místo konání"
                    value={form.location}
                    onChange={e => setForm({...form, location: e.target.value})}
                />

                <label>Datum konání</label>
                <input type="date"
                       onChange={e => setForm({...form, start_date: e.target.value})}/>
                <input type="date"
                       onChange={e => setForm({...form, end_date: e.target.value})}/>

                <label>Registrace</label>
                <input type="date"
                       onChange={e => setForm({...form, reg_start: e.target.value})}/>
                <input type="date"
                       onChange={e => setForm({...form, reg_end: e.target.value})}/>

                <label>Rozhodčí</label>

                <select
                    value={form.referee_id || ""}
                    onChange={e =>
                        setForm({...form, referee_id: Number(e.target.value)})
                    }
                >
                    <option value="">— vyber rozhodčího —</option>
                    {referees.map(r => (
                        <option key={r.referee_id} value={r.referee_id}>
                            {r.first_name} {r.last_name}
                            {r.category ? ` (${r.category})` : ""}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setMode("create")}
                >
                    ➕ Přidat nového rozhodčího
                </button>

                {mode === "create" && (
                    <div className="inline-card">
                        <h4>Nový rozhodčí</h4>

                        <input
                            placeholder="Jméno"
                            value={newReferee.first_name}
                            onChange={e =>
                                setNewReferee({ ...newReferee, first_name: e.target.value })
                            }
                        />

                        <input
                            placeholder="Příjmení"
                            value={newReferee.last_name}
                            onChange={e =>
                                setNewReferee({ ...newReferee, last_name: e.target.value })
                            }
                        />

                        <input
                            placeholder="Kategorie (volitelné)"
                            value={newReferee.category}
                            onChange={e =>
                                setNewReferee({ ...newReferee, category: e.target.value })
                            }
                        />

                        <div className="row">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={async () => {
                                    const res = await api.post("/referees", newReferee);

                                    // přidat do seznamu
                                    setReferees(prev => [...prev, res.data]);

                                    // rovnou vybrat
                                    setForm(f => ({
                                        ...f,
                                        referee_id: res.data.referee_id
                                    }));

                                    // reset
                                    setNewReferee({ first_name: "", last_name: "", category: "" });
                                    setMode("select");
                                }}
                            >
                                ✔ Uložit rozhodčího
                            </button>

                            <button
                                type="button"
                                className="btn-outline"
                                onClick={() => setMode("select")}
                            >
                                Zrušit
                            </button>
                        </div>
                    </div>
                )}

                <button className="btn-primary" onClick={submit}>
                    ✔ Vytvořit soutěž
                </button>
            </div>
        </div>
    );
}
