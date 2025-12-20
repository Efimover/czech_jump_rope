import { useEffect, useState } from "react";
import api from "../api/apiClient";
import AgeCategorySelect from "./AgeCategorySelect";

export default function DisciplineForm({ onCreated }) {
    const [form, setForm] = useState({
        name: "",
        type: "speed",
        is_team: false,
        pocet_athletes: "",
        age_categories: []
    });

    async function submit() {
        const res = await api.post("/disciplines", {
            ...form,
            pocet_athletes: form.is_team ? Number(form.pocet_athletes) : null
        });

        onCreated(res.data.discipline_id);
    }

    return (
        <div className="form-card">
            <h3>Nová disciplína</h3>

            <input
                placeholder="Název"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
            >
                <option value="speed">Speed</option>
                <option value="freestyle">Freestyle</option>
                <option value="double_dutch">Double Dutch</option>
                <option value="chinese_wheel">Chinese Wheel</option>
                <option value="other">Jiné</option>
            </select>

            <label>
                <input
                    type="checkbox"
                    checked={form.is_team}
                    onChange={e => setForm({ ...form, is_team: e.target.checked })}
                />
                Týmová disciplína
            </label>

            {form.is_team && (
                <input
                    type="number"
                    placeholder="Počet atletů v týmu"
                    value={form.pocet_athletes}
                    onChange={e => setForm({ ...form, pocet_athletes: e.target.value })}
                />
            )}

            <AgeCategorySelect
                value={form.age_categories}
                onChange={cats => setForm({ ...form, age_categories: cats })}
            />

            <button className="btn-primary" onClick={submit}>
                ✔ Vytvořit disciplínu
            </button>
        </div>
    );
}
