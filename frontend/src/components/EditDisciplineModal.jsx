import { useEffect, useState } from "react";
import api from "../api/apiClient";
import Modal from "./Modal.jsx";

export default function EditDisciplineModal({ discipline, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: discipline.name,
        type: discipline.type,
        is_team: discipline.is_team,
        pocet_athletes: discipline.pocet_athletes,
        age_categories: []
    });

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        api.get("/age-categories").then(res => {
            setCategories(res.data);

            const selected = res.data
                .filter(c => discipline.age_categories.includes(c.name))
                .map(c => c.age_category_id);

            setForm(f => ({ ...f, age_categories: selected }));
        });
    }, []);

    async function save() {
        await api.put(
            `/disciplines/competition/${discipline.competition_discipline_id}`, {
                ...form,
                pocet_athletes: form.is_team ? form.pocet_athletes : null
            });

        onSaved();
    }
    if (discipline.locked) {
        return (
            <Modal>
                <p>Disciplínu nelze upravit – soutěž již má přihlášky.</p>
            </Modal>
        );
    }

    return (
        <Modal title="Upravit disciplínu" onClose={onClose}>
            <div className="discipline-form">

                <div className="form-group">
                    <label>Název disciplíny</label>
                    <input
                        value={form.name}
                        onChange={e =>
                            setForm({ ...form, name: e.target.value })
                        }
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Typ disciplíny</label>
                        <select
                            value={form.type}
                            onChange={e =>
                                setForm({ ...form, type: e.target.value })
                            }
                        >
                            <option value="speed">Speed</option>
                            <option value="freestyle">Freestyle</option>
                            <option value="double_dutch">Double Dutch</option>
                            <option value="chinese_wheel">Chinese Wheel</option>
                            <option value="other">Jiný</option>
                        </select>
                    </div>

                    {form.type === "other" && (
                        <div className="form-group">
                            <label>Vlastní typ</label>
                            <input
                                value={customType}
                                onChange={e =>
                                    setCustomType(e.target.value)
                                }
                            />
                        </div>
                    )}
                </div>

                <hr />

                <label className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={form.is_team}
                        onChange={e =>
                            setForm({
                                ...form,
                                is_team: e.target.checked
                            })
                        }
                    />
                    Týmová disciplína
                </label>

                {form.is_team && (
                    <div className="form-group small">
                        <label>Počet členů</label>
                        <input
                            type="number"
                            min={2}
                            value={form.pocet_athletes || ""}
                            onChange={e =>
                                setForm({
                                    ...form,
                                    pocet_athletes: Number(e.target.value)
                                })
                            }
                        />
                    </div>
                )}

                <hr />

                <div className="form-group">
                    <label>Věkové kategorie</label>

                    <div className="age-grid">
                        {categories.map(c => (
                            <label key={c.age_category_id} className="age-pill">
                                <input
                                    type="checkbox"
                                    checked={form.age_categories.includes(
                                        c.age_category_id
                                    )}
                                    onChange={e =>
                                        setForm(f => ({
                                            ...f,
                                            age_categories: e.target.checked
                                                ? [
                                                    ...f.age_categories,
                                                    c.age_category_id
                                                ]
                                                : f.age_categories.filter(
                                                    id =>
                                                        id !==
                                                        c.age_category_id
                                                )
                                        }))
                                    }
                                />
                                {c.name}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button className="btn-primary" onClick={save}>
                        💾 Uložit změny
                    </button>
                </div>
            </div>
        </Modal>
    );
}
