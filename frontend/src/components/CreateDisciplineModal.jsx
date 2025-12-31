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

    function validate() {
        const errs = [];

        if (!form.name.trim()) errs.push("Musíte zadat název disciplíny.");
        if (!form.type) errs.push("Musíte vybrat typ disciplíny.");

        if (form.type === "other" && !customType.trim()) {
            errs.push("U typu „Jiný“ musíte vyplnit vlastní název.");
        }

        if (form.is_team && (!form.pocet_athletes || form.pocet_athletes < 2)) {
            errs.push("Týmová disciplína musí mít alespoň 2 členy.");
        }

        if (!useCustomAge && form.age_categories.length === 0) {
            errs.push("Musíte vybrat alespoň jednu věkovou kategorii.");
        }

        if (useCustomAge) {
            if (!customAge.name.trim()) errs.push("Vyplňte název věkové kategorie.");
            if (customAge.min_age === "") errs.push("Vyplňte minimální věk.");
            if (
                customAge.max_age !== "" &&
                Number(customAge.max_age) < Number(customAge.min_age)
            ) {
                errs.push("Maximální věk musí být větší než minimální.");
            }
        }

        setErrors(errs);
        return errs.length === 0;
    }

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
        <Modal title="Nová disciplína">
            {errors.length > 0 && (
                <div className="error-box">
                    <ul>
                        {errors.map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}

            <input
                placeholder="Název disciplíny *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
            >
                <option value="">Typ disciplíny *</option>
                <option value="speed">Speed</option>
                <option value="freestyle">Freestyle</option>
                <option value="double_dutch">Double Dutch</option>
                <option value="chinese_wheel">Chinese Wheel</option>
                <option value="other">Jiný</option>
            </select>

            {form.type === "other" && (
                <input
                    placeholder="Vlastní typ disciplíny *"
                    value={customType}
                    onChange={e => setCustomType(e.target.value)}
                />
            )}

            <label>
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
                <input
                    type="number"
                    min={2}
                    placeholder="Počet členů týmu *"
                    value={form.pocet_athletes}
                    onChange={e =>
                        setForm({ ...form, pocet_athletes: Number(e.target.value) })
                    }
                />
            )}

            <h4>Věkové kategorie *</h4>

            {!useCustomAge &&
                categories.map(c => (
                    <label key={c.age_category_id}>
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
                        {c.name} ({c.min_age}–{c.max_age ?? "∞"})
                    </label>
                ))}

            <label>
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
                <>
                    <input
                        placeholder="Název (např. 10–13 let) *"
                        value={customAge.name}
                        onChange={e =>
                            setCustomAge({ ...customAge, name: e.target.value })
                        }
                    />
                    <input
                        type="number"
                        placeholder="Min. věk *"
                        value={customAge.min_age}
                        onChange={e =>
                            setCustomAge({ ...customAge, min_age: e.target.value })
                        }
                    />
                    <input
                        type="number"
                        placeholder="Max. věk (volitelné)"
                        value={customAge.max_age}
                        onChange={e =>
                            setCustomAge({ ...customAge, max_age: e.target.value })
                        }
                    />
                </>
            )}

            <button onClick={submit} className="btn-primary">
                ✔ Vytvořit disciplínu
            </button>
        </Modal>
    );
}
