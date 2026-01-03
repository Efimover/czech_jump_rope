import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getCompetition,
    updateCompetition,
    getReferees
} from "../api/competitionApi";
import CompetitionDisciplines from "../components/CompetitionDisciplines.jsx";

import "../styles/competitionEdit.css";

export default function CompetitionEdit() {
    const { competitionId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [referees, setReferees] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});


    // 🔹 načti soutěž + rozhodčí
    useEffect(() => {
        async function load() {
            try {
                const [competition, refRes] = await Promise.all([
                    getCompetition(competitionId),
                    getReferees()
                ]);

                setForm({
                    name: competition.name,
                    description: competition.description || "",
                    location: competition.location || "",
                    start_date: competition.start_date?.slice(0, 10),
                    end_date: competition.end_date?.slice(0, 10),
                    reg_start: competition.reg_start?.slice(0, 10),
                    reg_end: competition.reg_end?.slice(0, 10),
                    referee_id: competition.referee_id || ""
                });

                setReferees(refRes.data);
            } catch (err) {
                console.error("Load error:", err);
            }
        }

        load();
    }, [competitionId]);

    const backendErrorMap = {
        INVALID_REGISTRATION_DATES: {
            field: "reg_end",
            message: "Registrace nemůže končit dříve než začne"
        },
        INVALID_COMPETITION_DATES: {
            field: "end_date",
            message: "Konec soutěže nemůže být dříve než začátek"
        },
        REGISTRATION_AFTER_START: {
            field: "reg_start",
            message: "Registrace musí začít nejpozději v den začátku soutěže"
        },
        REGISTRATION_OPEN: {
            field: "reg_start",
            message: "Po otevření registrace nelze měnit termíny"
        }
    };

    if (!form) return <p>Načítám…</p>;

    // 🔹 uložení změn
    async function save() {
        try {
            setSaving(true);
            setErrors({});

            await updateCompetition(competitionId, form);
            navigate(`/competitions/${competitionId}`);
        } catch (err) {
            const code = err.response?.data?.code;

            if (code && backendErrorMap[code]) {
                const { field, message } = backendErrorMap[code];
                setErrors({ [field]: message });
            } else {
                setErrors({
                    global:
                        err.response?.data?.error ||
                        "Nepodařilo se uložit změny"
                });
            }
        } finally {
            setSaving(false);
        }
    }

    function bind(name) {
        return {
            value: form[name],
            className: errors[name] ? "input-error" : "",
            onChange: e => {
                setForm({ ...form, [name]: e.target.value });
                if (errors[name]) {
                    setErrors(prev => ({ ...prev, [name]: null }));
                }
            }
        };
    }

    return (
        <div className="page-wrapper">
            <h1>Správa soutěže</h1>

            <div className="form-card">
                <input
                    placeholder="Název soutěže"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                />

                <textarea
                    placeholder="Popis"
                    value={form.description}
                    onChange={e =>
                        setForm({ ...form, description: e.target.value })
                    }
                />

                <input
                    placeholder="Místo"
                    value={form.location}
                    onChange={e =>
                        setForm({ ...form, location: e.target.value })
                    }
                />

                <label>Datum konání</label>

                <input type="date" {...bind("start_date")} />

                <input type="date" {...bind("end_date")} />
                {errors.end_date && (
                    <p className="error-text">{errors.end_date}</p>
                )}

                <label>Registrace</label>

                <input type="date" {...bind("reg_start")} />
                {errors.reg_start && (
                    <p className="error-text">{errors.reg_start}</p>
                )}

                <input type="date" {...bind("reg_end")} />
                {errors.reg_end && (
                    <p className="error-text">{errors.reg_end}</p>
                )}

                <label>Rozhodčí</label>
                <select
                    value={form.referee_id}
                    onChange={e =>
                        setForm({
                            ...form,
                            referee_id: e.target.value || null
                        })
                    }
                >
                    <option value="">— bez rozhodčího —</option>
                    {referees.map(r => (
                        <option key={r.referee_id} value={r.referee_id}>
                            {r.first_name} {r.last_name}
                            {r.category ? ` (${r.category})` : ""}
                        </option>
                    ))}
                </select>

                <button
                    className="btn-primary"
                    onClick={save}
                    disabled={saving}
                >
                    {saving ? "Ukládám…" : "✔ Uložit změny"}
                </button>
            </div>
            <CompetitionDisciplines competitionId={competitionId} />
        </div>
    );
}
