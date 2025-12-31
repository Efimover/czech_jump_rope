import { useEffect, useState } from "react";
import api from "../api/apiClient.js";
import Modal from "./Modal.jsx";

export default function CreateDisciplineModal({ competitionId, onClose, onCreated }) {
    const [form, setForm] = useState({
        name: "",
        type: "",
        is_team: false,
        pocet_athletes: "",
        age_categories: []
    });

    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState([]);

    // custom values
    const [customType, setCustomType] = useState("");
    const [useCustomAge, setUseCustomAge] = useState(false);
    const [customAge, setCustomAge] = useState({
        name: "",
        min_age: "",
        max_age: ""
    });

    useEffect(() => {
        api.get("/age-categories").then(res => setCategories(res.data));
    }, []);


    async function submit() {
        if (!validate()) return;

        try {
            let ageCategoryIds = [...form.age_categories];

            // 🔹 vytvoření vlastní věkové kategorie
            if (useCustomAge) {
                const code = `CUSTOM_${Date.now()}`;

                const res = await api.post("/age-categories", {
                    code,
                    name: customAge.name,
                    min_age: Number(customAge.min_age),
                    max_age:
                        customAge.max_age === ""
                            ? null
                            : Number(customAge.max_age)
                });

                ageCategoryIds = [res.data.age_category_id];
            }

            // 🔹 vytvoření disciplíny
            const disciplineRes = await api.post("/disciplines", {
                ...form,
                type: form.type === "other" ? customType : form.type,
                age_categories: ageCategoryIds
            });

            // 🔹 přiřazení k soutěži
            await api.post("/disciplines/assign", {
                competition_id: competitionId,
                discipline_id: disciplineRes.data.discipline_id
            });

            onCreated();
            onClose();
        } catch (err) {
            setErrors([
                err.response?.data?.error || "Nepodařilo se vytvořit disciplínu."
            ]);
        }
    }

    return (
        <Modal title="Nová disciplína" onClose={onClose}>
            {errors.length > 0 && (
                <div className="error-box">
                    <ul>
                        {errors.map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="discipline-form">

                {/* 🔹 Název */}
                <div className="form-group">
                    <label>Název disciplíny *</label>
                    <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                </div>

                {/* 🔹 Typ */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Typ disciplíny *</label>
                        <select
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="">— vyberte —</option>
                            <option value="speed">Speed</option>
                            <option value="freestyle">Freestyle</option>
                            <option value="double_dutch">Double Dutch</option>
                            <option value="chinese_wheel">Chinese Wheel</option>
                            <option value="other">Jiný</option>
                        </select>
                    </div>

                    {form.type === "other" && (
                        <div className="form-group">
                            <label>Vlastní typ *</label>
                            <input
                                value={customType}
                                onChange={e => setCustomType(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <hr />

                {/* 🔹 Týmová */}
                <label className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={form.is_team}
                        onChange={e =>
                            setForm({ ...form, is_team: e.target.checked })
                        }
                    />
                    Týmová disciplína
                </label>

                {form.is_team && (
                    <div className="form-group small">
                        <label>Počet členů *</label>
                        <input
                            type="number"
                            min={2}
                            value={form.pocet_athletes}
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

                {/* 🔹 Věkové kategorie */}
                <div className="form-group">
                    <label>Věkové kategorie *</label>

                    <div className="age-grid">
                        {categories.map(c => (
                            <label key={c.age_category_id} className="age-pill">
                                <input
                                    type="checkbox"
                                    checked={form.age_categories.includes(c.age_category_id)}
                                    onChange={e =>
                                        setForm(f => ({
                                            ...f,
                                            age_categories: e.target.checked
                                                ? [...f.age_categories, c.age_category_id]
                                                : f.age_categories.filter(id => id !== c.age_category_id)
                                        }))
                                    }
                                />
                                {c.name}
                            </label>
                        ))}
                    </div>
                </div>

                <label className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={useCustomAge}
                        onChange={e => {
                            setUseCustomAge(e.target.checked);
                            setForm(f => ({ ...f, age_categories: [] }));
                        }}
                    />
                    Jiná věková kategorie
                </label>

                {useCustomAge && (
                    <div className="form-row">
                        <div className="form-group">
                            <label>Název *</label>
                            <input
                                value={customAge.name}
                                onChange={e =>
                                    setCustomAge({ ...customAge, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="form-group small">
                            <label>Min</label>
                            <input
                                type="number"
                                value={customAge.min_age}
                                onChange={e =>
                                    setCustomAge({ ...customAge, min_age: e.target.value })
                                }
                            />
                        </div>
                        <div className="form-group small">
                            <label>Max</label>
                            <input
                                type="number"
                                value={customAge.max_age}
                                onChange={e =>
                                    setCustomAge({ ...customAge, max_age: e.target.value })
                                }
                            />
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button className="btn-primary" onClick={submit}>
                        Vytvořit disciplínu
                    </button>
                </div>
            </div>
        </Modal>
    );
}
