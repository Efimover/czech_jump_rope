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

    // const isRegistrationOpen =
    //     form &&
    //     new Date(form.reg_start) <= new Date() &&
    //     new Date() <= new Date(form.reg_end);

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

    if (!form) return <p>Načítám…</p>;

    // 🔹 uložení změn
    async function save() {
        try {
            setSaving(true);
            await updateCompetition(competitionId, form);
            navigate(`/competitions/${competitionId}`);
        } catch (err) {
            console.error("Save competition error:", err);
            alert(
                err.response?.data?.error ||
                "Nepodařilo se uložit změny"
            );
        } finally {
            setSaving(false);
        }
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
                {/*{isRegistrationOpen && (*/}
                {/*    <p className="info-box">*/}
                {/*        🔒 Registrace je otevřená – termíny nelze měnit.*/}
                {/*    </p>*/}
                {/*)}*/}

                <input
                    type="date"
                    value={form.start_date}
                    // disabled={isRegistrationOpen}

                    onChange={e =>
                        setForm({ ...form, start_date: e.target.value })
                    }
                />
                <input
                    type="date"
                    value={form.end_date}
                    // disabled={isRegistrationOpen}
                    onChange={e =>
                        setForm({ ...form, end_date: e.target.value })
                    }
                />

                <label>Registrace</label>
                <input
                    type="date"
                    value={form.reg_start}
                    // disabled={isRegistrationOpen}

                    onChange={e =>
                        setForm({ ...form, reg_start: e.target.value })
                    }
                />
                <input
                    type="date"
                    value={form.reg_end}
                    // disabled={isRegistrationOpen}
                    onChange={e =>
                        setForm({ ...form, reg_end: e.target.value })
                    }
                />

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
